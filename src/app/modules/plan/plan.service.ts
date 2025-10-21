import { Plan_Model } from "./plan.schema";

const get_all_plan_from_db = async () => {
  const result = await Plan_Model.find();

  return result;
};

const create_plan_into_db = async (payload: any) => {
  const result = await Plan_Model.create(payload);

  return result;
};

export const plan_service = {
  get_all_plan_from_db,
  create_plan_into_db,
};
