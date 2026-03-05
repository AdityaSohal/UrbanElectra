import express from "express";
import {adminRoute,protectRoute} from "../middleware/auth.middleware.js";
import {getAnalyticalData,setDailySalesData} from "../controllers/analytical.controller.js";

const router = express.Router();

router.get("/",protectRoute,adminRoute,async(req ,res) => {
    try {
        const analyticalData = await getAnalyticalData();
        const endDate = new Date();
        const startDate = new Date(endDate.getTime()-7*24*60*60*1000);
        const dailySalesData = await dailySalesData(startDate,endDate);
        res.json({
            analyticalData,
            dailySalesData,
        });
    } catch (error) {
        console.log("Error in analytical route",error.message);
        res.status(500).json({message: "server error",error:error.message});
    }
});

export default router;