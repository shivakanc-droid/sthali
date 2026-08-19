INSERT INTO agents (
 id,slug,agent_address,display_name,owner_name,owner_domain,owner_country,purpose,description,
 capabilities_json,supported_intents_json,autonomy_level,inbox_mode,inbox_url,data_policy,contact_policy,
 trust_badges_json,status,public_key,created_at,updated_at
) VALUES
('agt_utility_json_formatter','json-formatter-agent','json-formatter-agent@sthali.com','JSON Formatter and Validator Agent','Sthali','sthali.com','US',
 'Validates JSON text and returns a consistently formatted representation.','Send format_json with JSON text and optional indentation.',
 '["format_json","validate_json"]','[{"intent":"format_json","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'JSON is bounded and processed in memory; payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","developer_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_base64_codec','base64-encoder-decoder-agent','base64-encoder-decoder-agent@sthali.com','Base64 Encoder and Decoder Agent','Sthali','sthali.com','US',
 'Encodes UTF-8 text to Base64 or decodes Base64 back to UTF-8 text.','Send transform_base64 with action and text.',
 '["transform_base64","encode_base64","decode_base64"]','[{"intent":"transform_base64","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Text is bounded and processed in memory; payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","developer_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_url_codec','url-encoder-decoder-agent','url-encoder-decoder-agent@sthali.com','URL Encoder and Decoder Agent','Sthali','sthali.com','US',
 'Encodes or decodes URL components and complete URLs.','Send transform_url_encoding with action, mode, and text.',
 '["transform_url_encoding","encode_url","decode_url"]','[{"intent":"transform_url_encoding","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'URL text is bounded and processed in memory; payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","developer_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_uuid_generator','uuid-generator-agent','uuid-generator-agent@sthali.com','UUID Generator Agent','Sthali','sthali.com','US',
 'Generates one or more cryptographically secure UUID version 4 identifiers.','Send generate_uuids with count and optional formatting.',
 '["generate_uuids","generate_uuid_v4"]','[{"intent":"generate_uuids","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'No user content is required; generation parameters remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","developer_utility","web_crypto"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z'),
('agt_utility_timestamp_converter','timestamp-converter-agent','timestamp-converter-agent@sthali.com','Timestamp Converter Agent','Sthali','sthali.com','US',
 'Converts ISO 8601, Unix-second, and Unix-millisecond timestamps into canonical UTC forms.','Send convert_timestamp with value and optional numeric unit.',
 '["convert_timestamp","convert_unix_time","convert_iso8601"]','[{"intent":"convert_timestamp","requires_approval":false,"max_response_time_seconds":10}]','autonomous','hosted',NULL,
 'Timestamp values are processed in memory; payloads remain participant-scoped.','open','["system_agent","sthali_managed","hosted_inbox_active","auto_responder","developer_utility"]','listed',NULL,'2026-08-19T00:00:00.000Z','2026-08-19T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET
 slug=excluded.slug,agent_address=excluded.agent_address,display_name=excluded.display_name,owner_name=excluded.owner_name,
 owner_domain=excluded.owner_domain,owner_country=excluded.owner_country,purpose=excluded.purpose,description=excluded.description,
 capabilities_json=excluded.capabilities_json,supported_intents_json=excluded.supported_intents_json,autonomy_level=excluded.autonomy_level,
 inbox_mode=excluded.inbox_mode,inbox_url=excluded.inbox_url,data_policy=excluded.data_policy,contact_policy=excluded.contact_policy,
 trust_badges_json=excluded.trust_badges_json,status=excluded.status,public_key=excluded.public_key,updated_at=excluded.updated_at;
