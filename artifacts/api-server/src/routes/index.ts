import { Router } from "express";
import healthRouter from "./health";
import gameRouter from "./game";

const router = Router();

router.use(healthRouter);
router.use("/game", gameRouter);

export default router;
