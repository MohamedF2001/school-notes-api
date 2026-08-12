import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("❌ Erreur MongoDB : la variable MONGO_URI n'est pas définie");
    throw new Error("MONGO_URI manquant dans les variables d'environnement");
  }

  try {
    mongoose.set("strictQuery", true);

    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = connection.connections[0].readyState === 1;

    console.log("✅ Connexion MongoDB réussie");

    mongoose.connection.on("error", (err) => {
      console.error("❌ Erreur MongoDB :", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB déconnecté");
      isConnected = false;
    });

    return connection;
  } catch (error) {
    console.error("❌ Erreur MongoDB :", error.message);
    throw error;
  }
};

export default connectDB;
