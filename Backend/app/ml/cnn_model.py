"""
cnn_model.py — DEPRECATED / NOT USED IN PRODUCTION.

This defines a MobileNetV2-based architecture that does NOT match the
DenseNet-201 weights actually shipped in app/models/densenet_skin_best.h5
(see Backend/DATASET_GUIDE.md, which documents the DenseNet-201 training
process). Nothing in the app currently imports build_skin_model().

Production skin-model loading lives in app/ml/skin_model_loader.py, which
loads the full saved model (architecture + weights) directly via
tf.keras.models.load_model() rather than rebuilding an architecture by hand —
so it works regardless of what backbone the .h5 file actually contains.

Kept here for reference only. If you retrain a new skin model and want a
from-scratch architecture, update this file AND
app/ml/skin_model_loader.py's SKIN_CLASS_ORDER accordingly, then delete this
deprecation notice.
"""
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

def build_skin_model():
    base_model = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(224, 224, 3)
    )

    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)

    # 3 outputs → acne, pigmentation, dryness
    outputs = Dense(3, activation="sigmoid")(x)

    model = Model(inputs=base_model.input, outputs=outputs)

    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )

    return model
