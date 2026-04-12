export const updateBilling = async (data: {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}) => {
  console.log("Step 4 Data (Ignored):", data);
  // TODO: Completely ignore the billing information form rn, we dont have setup for that rn, I will create database schema for it later
};
