# https://huggingface.co/docs/transformers/en/model_doc/m2m_100


def translate_message(model, tokenizer, text_in: str, lang_from="en", lang_to="uk"):
    tokenizer.src_lang = lang_from
    inc_text = tokenizer(text_in, return_tensors="pt")
    generated_tokens = model.generate(
        **inc_text, forced_bos_token_id=tokenizer.get_lang_id(lang_to)
    )
    response = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
    return response
