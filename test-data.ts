// Demo account published in the Practice Software Testing docs
export const customer = {
  email: process.env.CUSTOMER_EMAIL ?? 'customer2@practicesoftwaretesting.com',
  password: process.env.CUSTOMER_PASSWORD ?? 'welcome01',
};

// Negative login tests use an account that doesn't exist: failed attempts on a
// real demo account lock it for everyone after a few tries
export const unknownUser = {
  email: 'no.such.user@example.com',
  password: 'wrong-password',
};
