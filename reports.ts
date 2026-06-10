@import "tailwindcss";

:root {
  color-scheme: light;
}

body {
  margin: 0;
  background: #f8fafc;
  color: #0f172a;
}

input,
select,
textarea,
button {
  font: inherit;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

.field {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  padding: 0.7rem 0.85rem;
  background: white;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  font-weight: 700;
  background: #0f172a;
  color: white;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  font-weight: 700;
  background: #e2e8f0;
  color: #0f172a;
}

.label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.35rem;
}
