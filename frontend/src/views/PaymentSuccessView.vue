<template>
  <div class="page-shell">
    <div class="card">
      <div class="icon">✓</div>
      <p class="eyebrow">Payment successful</p>
      <h1>Thank you for your order</h1>
      <p>Your order has been placed and a confirmation email is on the way.</p>
      <div class="actions">
        <router-link class="primary" to="/account">View orders</router-link>
        <router-link class="secondary" to="/products">Continue shopping</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  min-height: 70vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
}
.card {
  max-width: 560px;
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 2.2rem;
  text-align: center;
}
.icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 1rem;
  background: #dcfce7;
  color: #166534;
  font-size: 2.2rem;
  font-weight: 800;
}
.eyebrow {
  margin: 0;
  color: #4f46e5;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  font-weight: 800;
}
.card h1 {
  margin: 0.65rem 0 0.5rem;
  font-size: clamp(2rem, 4vw, 2.8rem);
}
.card p {
  color: #4b5563;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1.5rem;
}
.primary,
.secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.8rem 1.2rem;
  text-decoration: none;
  font-weight: 700;
}
.primary {
  background: #111827;
  color: white;
}
.secondary {
  background: #f3f4f6;
  color: #111827;
}
</style>
