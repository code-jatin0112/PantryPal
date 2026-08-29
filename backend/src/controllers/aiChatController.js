import {
  chatWithKitchenAssistant,
} from "../services/aiChatService.js";

export const chatWithKitchenAssistantController = async (
  req,
  res,
  next
) => {
  try {
    const result = await chatWithKitchenAssistant({
      userId: req.user.id,
      message: req.body.message,
      conversationHistory: req.body.conversationHistory,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

