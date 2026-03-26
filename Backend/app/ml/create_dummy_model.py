from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# Build base model
base_model = MobileNetV2(
    weights=None,
    include_top=False,
    input_shape=(224, 224, 3)
)

x = base_model.output
x = GlobalAveragePooling2D()(x)

# 3 outputs: acne, pigmentation, dryness
outputs = Dense(3, activation="sigmoid")(x)

model = Model(inputs=base_model.input, outputs=outputs)

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

# Save model
model.save("app/models/skin_cnn.h5")

print("✅ Dummy CNN model saved at app/models/skin_cnn.h5")
