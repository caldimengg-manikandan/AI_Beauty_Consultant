import os
import torch
from transformers import (
    MBartForConditionalGeneration, 
    MBart50TokenizerFast, 
    Seq2SeqTrainingArguments, 
    Seq2SeqTrainer, 
    DataCollatorForSeq2Seq
)
from datasets import load_dataset, load_metric
import numpy as np

# 1. SETUP - Use Many-to-Many as base
MODEL_NAME = "facebook/mbart-large-50-many-to-many-mmt"
SOURCE_LANG = "en_XX"
TARGET_LANG = "hi_IN" # Example for Hindi

def train_model():
    print("🚀 Starting Fine-Tuning Pipeline...")
    
    # 2. LOAD DATASET (IIT Bombay Corpus)
    print("📥 Loading IIT Bombay Corpus...")
    # For demo purposes, we load a small subset. For production, use the full set.
    dataset = load_dataset("cfilt/iit_bombay_corpus")
    
    # 3. TOKENIZATION
    tokenizer = MBart50TokenizerFast.from_pretrained(MODEL_NAME, src_lang=SOURCE_LANG, tgt_lang=TARGET_LANG)
    model = MBartForConditionalGeneration.from_pretrained(MODEL_NAME)

    max_input_length = 128
    max_target_length = 128

    def preprocess_function(examples):
        inputs = [ex["en"] for ex in examples["translation"]]
        targets = [ex["hi"] for ex in examples["translation"]]
        model_inputs = tokenizer(inputs, max_length=max_input_length, truncation=True, padding="max_length")

        # Set up the tokenizer for targets
        with tokenizer.as_target_tokenizer():
            labels = tokenizer(targets, max_length=max_target_length, truncation=True, padding="max_length")

        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    print("✂️ Preprocessing data...")
    tokenized_datasets = dataset.map(preprocess_function, batched=True, remove_columns=dataset["train"].column_names)

    # 4. TRAINING ARGUMENTS
    args = Seq2SeqTrainingArguments(
        output_dir="./mbart-iitb-finetuned",
        evaluation_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        weight_decay=0.01,
        save_total_limit=3,
        num_train_epochs=3,
        predict_with_generate=True,
        fp16=True, # Use Mixed Precision for speed
        push_to_hub=False,
        report_to="none"
    )

    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    # 5. TRAINER
    trainer = Seq2SeqTrainer(
        model,
        args,
        train_dataset=tokenized_datasets["train"].shuffle(seed=42).select(range(10000)), # Sample 10k for speed
        eval_dataset=tokenized_datasets["validation"],
        data_collator=data_collator,
        tokenizer=tokenizer,
    )

    print("🏋️ Training started...")
    trainer.train()
    
    # 6. SAVE
    print("💾 Saving fine-tuned model...")
    trainer.save_model("./models/mbart-beauty-expert")
    print("✅ Training complete! Model saved to ./models/mbart-beauty-expert")

if __name__ == "__main__":
    train_model()
