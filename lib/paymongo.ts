const PAYMONGO_API = 'https://api.paymongo.com/v1'

function authHeader() {
   const key = process.env.PAYMONGO_SECRET_KEY!
   return 'Basic ' + Buffer.from(`${key}:`).toString('base64')
}

async function paymongoFetch(path: string, attributes: object) {
   const res = await fetch(`${PAYMONGO_API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
      body: JSON.stringify({ data: { attributes } }),
   })

   const json = await res.json()
   if (!res.ok) throw new Error(json.errors?.[0]?.detail ?? 'PayMongo request failed')
   return json.data
}

// PayMongo amounts are in centavos (₱100.00 = 10000)
export function pesosToCentavos(pesos: number) {
   return Math.round(pesos * 100)
}

export async function createPaymentIntent(amountPesos: number, description: string, allowedMethod: string) {
   return paymongoFetch('/payment_intents', {
      amount: pesosToCentavos(amountPesos),
      currency: 'PHP',
      payment_method_allowed: [allowedMethod],
      description,
   })
}

export async function createPaymentMethod(
   type: string,
   billing: { name: string; email: string; phone: string }
) {
   return paymongoFetch('/payment_methods', { type, billing })
}

export async function attachPaymentMethod(
   paymentIntentId: string,
   paymentMethodId: string,
   clientKey: string,
   returnUrl: string
) {
   return paymongoFetch(`/payment_intents/${paymentIntentId}/attach`, {
      payment_method: paymentMethodId,
      client_key: clientKey,
      return_url: returnUrl,
   })
}