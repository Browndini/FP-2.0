import * as admin from "firebase-admin";

admin.initializeApp();

export { createStarterPet } from "./createStarterPet";
export { performCareAction } from "./performCareAction";
export { renamePet } from "./renamePet";
export { syncPetDecay } from "./syncPetDecay";
export { purchaseItem } from "./purchaseItem";
export { setUsername } from "./setUsername";
export { startMiniGameSession } from "./startMiniGameSession";
export { claimMiniGameReward } from "./claimMiniGameReward";
export { createTradeOffer } from "./createTradeOffer";
export { cancelTrade } from "./cancelTrade";
export { executeTrade } from "./executeTrade";
export { initiateBreeding } from "./initiateBreeding";
export { respondBreeding } from "./respondBreeding";
export { cancelBreeding } from "./cancelBreeding";
export { hatchEgg } from "./hatchEgg";
