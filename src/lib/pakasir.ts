import axios from 'axios';

/**
 * PAKASIR API Utility
 * Digunakan untuk membuat transaksi pembayaran
 */
export const createPakasirTransaction = async (params: {
  method: string;
  order_id: string;
  amount: number;
  project: string;
  api_key: string;
}) => {
  const { method, order_id, amount, project, api_key } = params;
  
  try {
    const response = await axios.post(`https://app.pakasir.com/api/transactioncreate/${method}`, {
      project,
      order_id,
      amount,
      api_key
    });
    
    return response.data;
  } catch (error) {
    console.error("Pakasir Transaction Error:", error);
    throw error;
  }
};
