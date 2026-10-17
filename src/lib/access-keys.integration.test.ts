import { describe, expect, it } from "vitest";
import postgres from "postgres";

// Uses the connected database, rolls every fixture back, sends no auth email.
const connection = process.env.SUPABASE_DB_URL;
describe.skipIf(!connection)("Access-key database integration (rollback only)", () => {
  it("enforces atomic signup, ownership, retention, RLS and admin permissions", async () => {
    if (!connection) return;
    const sql = postgres(connection, { max: 1, onnotice: () => {} });
    let assertions = 0;
    try {
      await sql.begin(async tx => {
        const admin = "72094982-f30a-4770-81b2-0c08b0d897c3";
        const ordinary = "c01ea866-7b07-4824-aae1-76271a59aa27";
        const snapshot = await tx`select count(*)::int as n from auth.users`;
        const legacy = await tx`select count(*)::int as n from public.access_authorizations where source='legacy' and active`;
        expect(legacy[0]?.n).toBe(7); assertions++;
        await tx`select set_config('request.jwt.claim.sub', ${admin}, true)`;
        const issued = await tx`select public.generate_access_keys(3) as keys`;
        const keys = issued[0]?.keys as { id: string; key: string }[];
        expect(keys).toHaveLength(3); assertions++;
        const key = keys[0]; const revoked = keys[1]; const partial = keys[2];
        if (!key || !revoked || !partial) throw new Error("Missing test fixture");
        expect(key.key.length).toBe(67); assertions++;
        const stored = await tx`select key_hash,bound_user_id from public.access_keys where id=${key.id}`;
        expect(stored[0]?.key_hash).not.toBe(key.key); expect(stored[0]?.bound_user_id).toBeNull(); assertions++;
        const invalid = await tx`select public.validate_access_key('integration-invalid') as result`;
        expect(invalid[0]?.result.code).toBe("invalid"); assertions++;
        await tx`select public.revoke_access_key(${revoked.id})`;
        const blocked = await tx`select public.validate_access_key(${revoked.key}) as result`;
        expect(blocked[0]?.result.code).toBe("revoked"); assertions++;
        const validated = await tx`select public.validate_access_key(${key.key}) as result`;
        const ticket = validated[0]?.result.ticket;
        expect(validated[0]?.result.ok).toBe(true); assertions++;
        const notConsumed = await tx`select status from public.access_keys where id=${key.id}`;
        expect(notConsumed[0]?.status).toBe("active"); assertions++;
        await expect(tx.savepoint(async s => {
          await s`insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),'no-key-integration@example.invalid','{}'::jsonb)`;
        })).rejects.toThrow("ACCESS_KEY_REQUIRED"); assertions++;
        const created = await tx`insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),'key-integration@example.invalid',${JSON.stringify({ access_ticket: ticket })}::jsonb) returning id,raw_user_meta_data`;
        const uid = created[0]?.id;
        expect(created[0]?.raw_user_meta_data.access_ticket).toBeUndefined(); assertions++;
        const bound = await tx`select bound_user_id,status,registration_email from public.access_keys where id=${key.id}`;
        expect(bound[0]).toMatchObject({ bound_user_id: uid, status: "used", registration_email: "key-integration@example.invalid" }); assertions++;
        const authz = await tx`select active from public.access_authorizations where user_id=${uid}`;
        expect(authz[0]?.active).toBe(true); assertions++;
        const reused = await tx`select public.validate_access_key(${key.key}) as result`;
        expect(reused[0]?.result.code).toBe("used"); assertions++;
        await expect(tx.savepoint(async s => {
          await s`insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),'reuse-integration@example.invalid',${JSON.stringify({ access_ticket: ticket })}::jsonb)`;
        })).rejects.toThrow("ACCESS_KEY_USED"); assertions++;
        await tx`update auth.users set email='changed-integration@example.invalid',encrypted_password='integration-only',email_confirmed_at=now() where id=${uid}`;
        const login = await tx`select public.validate_access_key(${key.key},'login','changed-integration@example.invalid') as result`;
        expect(login[0]?.result.code).toBe("email_confirmation_required"); assertions++;
        await tx`select set_config('request.jwt.claim.sub', '', true)`;
        expect((await tx`select bound_user_id from public.access_keys where id=${key.id}`)[0]?.bound_user_id).toBe(uid); assertions++;
        await expect(tx.savepoint(async s => {
          await s`update public.access_keys set status='active',bound_user_id=null,registration_email=null,used_at=null where id=${key.id}`;
        })).rejects.toThrow("ACCESS_KEY_IMMUTABLE"); assertions++;
        await tx`delete from auth.users where id=${uid}`;
        expect((await tx`select status from public.access_keys where id=${key.id}`)[0]?.status).toBe("used"); assertions++;
        const pv = await tx`select public.validate_access_key(${partial.key}) as result`;
        await expect(tx.savepoint(async s => {
          await s`insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),'partial-integration@example.invalid',${JSON.stringify({ access_ticket: pv[0]?.result.ticket })}::jsonb)`;
          throw new Error("forced downstream failure");
        })).rejects.toThrow("forced downstream failure");
        expect((await tx`select status,bound_user_id from public.access_keys where id=${partial.id}`)[0]).toMatchObject({ status: "active", bound_user_id: null }); assertions++;
        await tx`select set_config('request.jwt.claim.sub', ${ordinary}, true)`;
        await tx`set local role authenticated`;
        expect((await tx`select id from public.access_keys`).length).toBe(0); assertions++;
        expect((await tx`select user_id from public.access_authorizations`).every(r => r.user_id===ordinary)).toBe(true); assertions++;
        await expect(tx.savepoint(async s => { await s`select public.generate_access_keys(1)`; })).rejects.toThrow("ADMIN_REQUIRED"); assertions++;
        await expect(tx.savepoint(async s => { await s`select public.revoke_access_key(${partial.id})`; })).rejects.toThrow("ADMIN_REQUIRED"); assertions++;
        await tx`reset role`;
        expect((await tx`select count(*)::int as n from auth.users`)[0]?.n).toBe(snapshot[0]?.n); assertions++;
        throw new Error("ROLLBACK_INTEGRATION_OK");
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "ROLLBACK_INTEGRATION_OK") throw error;
    } finally { await sql.end(); }
    expect(assertions).toBe(24);
  }, 60_000);
});