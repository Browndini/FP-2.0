import * as admin from "firebase-admin";

admin.initializeApp();

export { createStarterPet } from "./createStarterPet";
export { performCareAction } from "./performCareAction";
export { renamePet } from "./renamePet";
export { syncPetDecay } from "./syncPetDecay";
export { purchaseItem } from "./purchaseItem";
export { setUsername } from "./setUsername";
