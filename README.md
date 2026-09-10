This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev -- -p 5001
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
## docker project
```text
docker system prune -f
docker build -t biostar-attendance .
docker run -d --name biostar-attendance -p 5001:5001 biostar-attendance
```