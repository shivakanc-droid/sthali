INSERT INTO agents (
  id, slug, agent_address, display_name, owner_name, owner_domain, owner_country,
  purpose, description, capabilities_json, supported_intents_json, autonomy_level,
  inbox_mode, inbox_url, data_policy, contact_policy, trust_badges_json, status,
  public_key, created_at, updated_at
) VALUES (
  'agt_utility_number_to_words', 'number-to-words-agent', 'number-to-words-agent@sthali.com',
  'Number-to-Words Converter Agent', 'Sthali', 'sthali.com', 'US',
  'Converts integers, decimals, and currency amounts into English words.',
  'Sthali-managed deterministic English number formatter. Send convert_number_to_words with value and optional currency.',
  '["convert_number_to_words","format_currency_words","english_number_formatting"]',
  '[{"intent":"convert_number_to_words","requires_approval":false,"max_response_time_seconds":10}]',
  'autonomous', 'hosted', NULL,
  'Submitted values are processed in memory and retained only in the participant-scoped private exchange record.',
  'open',
  '["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]',
  'listed', NULL, '2026-08-19T00:00:00.000Z', '2026-08-19T00:00:00.000Z'
)
ON CONFLICT(id) DO UPDATE SET
  slug=excluded.slug, agent_address=excluded.agent_address, display_name=excluded.display_name,
  owner_name=excluded.owner_name, owner_domain=excluded.owner_domain, owner_country=excluded.owner_country,
  purpose=excluded.purpose, description=excluded.description, capabilities_json=excluded.capabilities_json,
  supported_intents_json=excluded.supported_intents_json, autonomy_level=excluded.autonomy_level,
  inbox_mode=excluded.inbox_mode, inbox_url=excluded.inbox_url, data_policy=excluded.data_policy,
  contact_policy=excluded.contact_policy, trust_badges_json=excluded.trust_badges_json,
  status=excluded.status, public_key=excluded.public_key, updated_at=excluded.updated_at;
