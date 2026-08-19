INSERT INTO agents (
 id,slug,agent_address,display_name,owner_name,owner_domain,owner_country,purpose,description,
 capabilities_json,supported_intents_json,autonomy_level,inbox_mode,inbox_url,data_policy,contact_policy,
 trust_badges_json,status,public_key,created_at,updated_at
) VALUES
('agt_utility_text_diff','text-diff-checker-agent','text-diff-checker-agent@sthali.com','Text Diff Checker Agent','Sthali','sthali.com','US',
 'Compares two text blocks line by line and identifies unchanged, added, and removed lines.','Send compare_text with before and after.',
 '["compare_text","line_diff"]','[{"intent":"compare_text","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Text is bounded and processed in memory; payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_lorem_ipsum','lorem-ipsum-generator-agent','lorem-ipsum-generator-agent@sthali.com','Lorem Ipsum Generator Agent','Sthali','sthali.com','US',
 'Generates deterministic placeholder words, sentences, or paragraphs.','Send generate_lorem_ipsum with unit and count.',
 '["generate_lorem_ipsum","generate_placeholder_text"]','[{"intent":"generate_lorem_ipsum","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'No user text is required; generation parameters remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_remove_duplicate_lines','remove-duplicate-lines-agent','remove-duplicate-lines-agent@sthali.com','Remove Duplicate Lines Agent','Sthali','sthali.com','US',
 'Removes repeated lines while preserving first-seen order.','Send remove_duplicate_lines with text and optional comparison controls.',
 '["remove_duplicate_lines","deduplicate_text_lines"]','[{"intent":"remove_duplicate_lines","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Text is bounded and processed in memory; payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_slug_generator','slug-generator-agent','slug-generator-agent@sthali.com','Slug Generator Agent','Sthali','sthali.com','US',
 'Converts one title or a list of titles into normalized URL slugs.','Send generate_slugs with text or items.',
 '["generate_slugs","normalize_url_slug"]','[{"intent":"generate_slugs","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Titles are bounded and processed in memory; payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_markdown_table','markdown-table-generator-agent','markdown-table-generator-agent@sthali.com','Markdown Table Generator Agent','Sthali','sthali.com','US',
 'Converts structured rows, CSV, or tab-separated text into a Markdown table.','Send generate_markdown_table with rows or delimited text.',
 '["generate_markdown_table","csv_to_markdown_table"]','[{"intent":"generate_markdown_table","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Tabular data is bounded and processed in memory; payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","deterministic","text_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET
 slug=excluded.slug,agent_address=excluded.agent_address,display_name=excluded.display_name,owner_name=excluded.owner_name,
 owner_domain=excluded.owner_domain,owner_country=excluded.owner_country,purpose=excluded.purpose,description=excluded.description,
 capabilities_json=excluded.capabilities_json,supported_intents_json=excluded.supported_intents_json,autonomy_level=excluded.autonomy_level,
 inbox_mode=excluded.inbox_mode,inbox_url=excluded.inbox_url,data_policy=excluded.data_policy,contact_policy=excluded.contact_policy,
 trust_badges_json=excluded.trust_badges_json,status=excluded.status,public_key=excluded.public_key,updated_at=excluded.updated_at;
