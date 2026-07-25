import "server-only";

import {
  buildPersonalOrgSlug,
  waIdToE164,
} from "@/features/whatsapp/server/phone-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { logInfo } from "@/lib/logger";
import type { Tables } from "@/types/database";

export type WhatsAppUserContext = {
  profile: Tables<"profiles">;
  organization: Tables<"organizations">;
  session: Tables<"whatsapp_sessions">;
  isNewUser: boolean;
};

type ResolveOptions = {
  waId: string;
  inboundAt?: Date;
};

/**
 * Resolves WhatsApp sender to profile + personal org + session.
 * Creates all three on first contact.
 */
export async function resolveOrCreateWhatsAppUser(
  options: ResolveOptions,
): Promise<WhatsAppUserContext> {
  const { waId } = options;
  const inboundAt = (options.inboundAt ?? new Date()).toISOString();
  const supabase = createAdminClient();

  const { data: existingIdentity, error: lookupError } = await supabase
    .from("whatsapp_identities")
    .select("profile_id")
    .eq("wa_id", waId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`WhatsApp identity lookup failed: ${lookupError.message}`);
  }

  if (existingIdentity?.profile_id) {
    return loadExistingUserContext(supabase, waId, existingIdentity.profile_id, inboundAt);
  }

  return createNewUserContext(supabase, waId, inboundAt);
}

async function loadExistingUserContext(
  supabase: ReturnType<typeof createAdminClient>,
  waId: string,
  profileId: string,
  inboundAt: string,
): Promise<WhatsAppUserContext> {
  const [profileResult, orgResult, sessionResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).single(),
    supabase
      .from("organizations")
      .select("*")
      .eq("owner_profile_id", profileId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("whatsapp_sessions").select("*").eq("wa_id", waId).single(),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new Error(
      `Profile load failed: ${profileResult.error?.message ?? "not found"}`,
    );
  }

  let session = sessionResult.data;

  if (sessionResult.error || !session) {
    const { data: createdSession, error: createSessionError } = await supabase
      .from("whatsapp_sessions")
      .insert({
        profile_id: profileId,
        wa_id: waId,
        last_inbound_at: inboundAt,
        state: { step: "welcome" },
      })
      .select("*")
      .single();

    if (createSessionError || !createdSession) {
      throw new Error(
        `Session create failed: ${createSessionError?.message ?? "unknown"}`,
      );
    }

    session = createdSession;
  }

  let organization = orgResult.data;

  if (!organization) {
    const created = await createPersonalOrganization(
      supabase,
      profileId,
    );
    organization = created;
  }

  await Promise.all([
    supabase
      .from("whatsapp_identities")
      .update({ last_seen_at: inboundAt })
      .eq("wa_id", waId),
    supabase
      .from("whatsapp_sessions")
      .update({ last_inbound_at: inboundAt })
      .eq("wa_id", waId),
  ]);

  return {
    profile: profileResult.data,
    organization,
    session,
    isNewUser: false,
  };
}

async function createNewUserContext(
  supabase: ReturnType<typeof createAdminClient>,
  waId: string,
  inboundAt: string,
): Promise<WhatsAppUserContext> {
  const phoneE164 = waIdToE164(waId);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({ display_name: null })
    .select("*")
    .single();

  if (profileError || !profile) {
    throw new Error(
      `Profile create failed: ${profileError?.message ?? "unknown"}`,
    );
  }

  const organization = await createPersonalOrganization(supabase, profile.id);

  const { error: identityError } = await supabase
    .from("whatsapp_identities")
    .insert({
      profile_id: profile.id,
      wa_id: waId,
      phone_e164: phoneE164,
      last_seen_at: inboundAt,
    });

  if (identityError) {
    throw new Error(`WhatsApp identity create failed: ${identityError.message}`);
  }

  const { data: session, error: sessionError } = await supabase
    .from("whatsapp_sessions")
    .insert({
      profile_id: profile.id,
      wa_id: waId,
      last_inbound_at: inboundAt,
      state: { step: "welcome" },
    })
    .select("*")
    .single();

  if (sessionError || !session) {
    throw new Error(
      `WhatsApp session create failed: ${sessionError?.message ?? "unknown"}`,
    );
  }

  logInfo("whatsapp.user.created", {
    profileId: profile.id,
    organizationId: organization.id,
    waId,
  });

  return {
    profile,
    organization,
    session,
    isNewUser: true,
  };
}

async function createPersonalOrganization(
  supabase: ReturnType<typeof createAdminClient>,
  profileId: string,
): Promise<Tables<"organizations">> {
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: "Personal",
      slug: buildPersonalOrgSlug(profileId),
      owner_profile_id: profileId,
    })
    .select("*")
    .single();

  if (orgError || !organization) {
    throw new Error(
      `Organization create failed: ${orgError?.message ?? "unknown"}`,
    );
  }

  return organization;
}

/** Records outbound message timestamp on the WhatsApp session. */
export async function touchWhatsAppSessionOutbound(waId: string): Promise<void> {
  const supabase = createAdminClient();
  const outboundAt = new Date().toISOString();

  const { error } = await supabase
    .from("whatsapp_sessions")
    .update({ last_outbound_at: outboundAt })
    .eq("wa_id", waId);

  if (error) {
    throw new Error(`Session outbound touch failed: ${error.message}`);
  }
}
