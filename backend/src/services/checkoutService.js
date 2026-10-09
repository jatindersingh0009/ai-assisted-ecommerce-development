const COD_FEE_CENTS = 1000;

const getPaymentMethodFee = (paymentMethod = '') => {
  if (String(paymentMethod).toLowerCase() === 'cod') {
    return COD_FEE_CENTS;
  }

  return 0;
};

const calculateCartTotals = ({
  items = [],
  discountCents = 0,
  shippingCostCents = 0,
  taxRate = 0.08,
  codFeeCents = 0,
}) => {
  const subtotalCents = (items || []).reduce((sum, item) => {
    const unitPrice = Number(item.priceCents || item.price || 0);
    const quantity = Number(item.quantity || 1);
    return sum + (unitPrice * quantity);
  }, 0);

  const discount = Number(discountCents || 0);
  const shipping = Number(shippingCostCents || 0);
  const taxBase = Math.max(0, subtotalCents - discount);
  const tax = Math.round(taxBase * Number(taxRate || 0));
  const codFee = Number(codFeeCents || 0);
  const grandTotalCents = subtotalCents - discount + shipping + tax + codFee;

  return {
    subtotalCents,
    discountCents: discount,
    shippingCostCents: shipping,
    taxCents: tax,
    codFeeCents: codFee,
    grandTotalCents,
  };
};

module.exports = {
  COD_FEE_CENTS,
  getPaymentMethodFee,
  calculateCartTotals,
};
