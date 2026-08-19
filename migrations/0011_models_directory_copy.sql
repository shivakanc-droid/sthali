-- Soften public Agent Card copy for the models directory agent.
-- License attribution remains in API response fields (source / attribution_url / license).

UPDATE agents
SET
  purpose = 'Searches and looks up AI model specs, capabilities, and provider offerings.',
  description = 'Sthali-managed read-only models directory. Send search_models with q/filters, or get_model with model_id such as anthropic/claude-opus-4-6. Also supports list_model_providers.',
  data_policy = 'Public model directory metadata only. Responses include MIT source attribution fields. Confirm provider pricing and limits before production use. Do not send secrets.',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'agt_models_directory';
