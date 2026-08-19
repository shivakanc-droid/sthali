INSERT INTO agents (
  id, slug, agent_address, display_name, owner_name, owner_domain, owner_country,
  purpose, description, capabilities_json, supported_intents_json, autonomy_level,
  inbox_mode, inbox_url, data_policy, contact_policy, trust_badges_json, status,
  public_key, created_at, updated_at
) VALUES
('agt_utility_character_counter','character-counter-agent','character-counter-agent@sthali.com','Character Counter Agent','Sthali','sthali.com','US',
 'Counts Unicode characters, code units, bytes, whitespace, words, and lines.','Send count_characters with text.',
 '["count_characters","count_text_metrics"]','[{"intent":"count_characters","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Text is processed in memory and retained only in the participant-scoped exchange record.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_roman_numeral','roman-numeral-converter-agent','roman-numeral-converter-agent@sthali.com','Roman Numeral Converter Agent','Sthali','sthali.com','US',
 'Converts integers from 1 to 3999 and canonical Roman numerals in either direction.','Send convert_roman_numeral with value.',
 '["convert_roman_numeral","roman_to_integer","integer_to_roman"]','[{"intent":"convert_roman_numeral","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Values are processed in memory and retained only in the participant-scoped exchange record.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_markdown_preview','markdown-preview-agent','markdown-preview-agent@sthali.com','Markdown Preview Agent','Sthali','sthali.com','US',
 'Renders a conservative Markdown subset into escaped, safe HTML.','Send render_markdown_preview with markdown.',
 '["render_markdown_preview","safe_markdown_html"]','[{"intent":"render_markdown_preview","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Markdown is processed in memory; raw HTML is escaped. Payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_case_converter','case-converter-agent','case-converter-agent@sthali.com','Case Converter Agent','Sthali','sthali.com','US',
 'Converts text to upper, lower, title, sentence, camel, snake, or kebab case.','Send convert_text_case with text and mode.',
 '["convert_text_case","upper_case","lower_case","title_case","camel_case","snake_case","kebab_case"]','[{"intent":"convert_text_case","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Text is processed in memory and retained only in the participant-scoped exchange record.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_readability','readability-score-agent','readability-score-agent@sthali.com','Readability Score Checker Agent','Sthali','sthali.com','US',
 'Estimates English reading ease, grade level, sentence length, and word complexity.','Send check_readability with English text.',
 '["check_readability","flesch_reading_ease","flesch_kincaid_grade"]','[{"intent":"check_readability","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Text is processed in memory. Scores are heuristic estimates, not educational or accessibility certification.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET
 slug=excluded.slug,agent_address=excluded.agent_address,display_name=excluded.display_name,owner_name=excluded.owner_name,
 owner_domain=excluded.owner_domain,owner_country=excluded.owner_country,purpose=excluded.purpose,description=excluded.description,
 capabilities_json=excluded.capabilities_json,supported_intents_json=excluded.supported_intents_json,autonomy_level=excluded.autonomy_level,
 inbox_mode=excluded.inbox_mode,inbox_url=excluded.inbox_url,data_policy=excluded.data_policy,contact_policy=excluded.contact_policy,
 trust_badges_json=excluded.trust_badges_json,status=excluded.status,public_key=excluded.public_key,updated_at=excluded.updated_at;
