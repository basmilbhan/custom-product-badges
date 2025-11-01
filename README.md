# Custom Product Badges - Shopify App

A Shopify app that allows merchants to create and display custom badges on their products. Badges are rendered on the storefront and can be customized with different colors and positions.

## Features

- ✅ Create custom badges with name and color
- ✅ Assign badges to multiple products
- ✅ Display badges on storefront (product pages & collections)
- ✅ Edit and delete badges
- ✅ Multi-tenant support (data isolated per shop)
- ✅ Customizable badge position and size
- ✅ Automatic text color contrast

## Tech Stack

- **Framework**: Remix 
- **Database**: Prisma + SQLite (development)
- **UI**: Shopify Polaris
- **Shopify Integration**: App Bridge, Admin API
- **Storefront**: Theme Block App Extension (Liquid)

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Shopify Partner account
- Development store or Shopify Plus sandbox

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/basmilbhan/Shopify-App---Custom-Product-Badge.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Shopify App

If you haven't created a Shopify app yet:

```bash
npm run shopify app init
```

Follow the prompts to connect to your Shopify Partner account and create/select an app.

### 4. Configure Database

Initialize the database schema:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development Server

```bash
npm run dev
```

This will:
- Start the Remix dev server
- Create a tunnel using Cloudflare
- Open your app in the Shopify admin

### 6. Install App on Development Store

When the dev server starts, it will provide a URL to install the app on your development store. Follow the link and approve the installation.

## Project Structure

```
custom-product-badges/
├── app/
│   ├── routes/
│   │   ├── app.custom-badge.tsx    # Main badge management UI
│   │   └── api.badge.tsx           # API endpoint for storefront
│   ├── db.server.ts                # Prisma client
│   └── shopify.server.ts           # Shopify app config
├── extensions/
│   └── custom-badges/              # Theme app extension
│       └── blocks/
│           └── custom_badges.liquid # Storefront badge rendering
├── prisma/
│   └── schema.prisma               # Database schema
└── package.json
```

## Database Schema

```prisma
model Badge {
  id        String   @id @default(cuid())
  productId String
  name      String
  color     String
  shop      String
  createdAt DateTime @default(now())
}
```

## Usage

### Admin Interface

1. Go to your Shopify admin
2. Navigate to **Apps** > **Custom Product Badges**
3. Click **Create new product badge**
4. Select products (only products without badges shown)
5. Enter badge name and choose color
6. Click **Create badge**

### Storefront Display

To display badges on your storefront:

1. Go to **Online Store** > **Themes** > **Customize**
2. Navigate to a product page or collection
3. Click **Add block** > **Apps** > **Product Badge**
4. Configure position and size settings
5. Save

**Note**: You need to configure an App Proxy in your Shopify Partner Dashboard for storefront rendering to work. See [Deployment](#deployment) below.

## Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run deploy       # Deploy app to Shopify
npm run shopify      # Run Shopify CLI commands
```

### Database Commands

```bash
npx prisma studio              # Open Prisma Studio (DB GUI)
npx prisma migrate dev         # Create new migration
npx prisma generate            # Regenerate Prisma client
npx prisma migrate reset       # Reset database
```

### Testing Locally

1. Start the dev server: `npm run dev`
2. Install the app on your development store
3. Create some badges in the admin
4. Add the badge block to your theme
5. View products on the storefront

## Deployment

### 1. Deploy the App

```bash
npm run deploy
```



## Troubleshooting

### Badges not appearing on storefront?
- Check if using Dawn theme (recommended and tested)
- Verify app proxy is configured correctly
- Check that badges are assigned to products
- Ensure the badge block is added to the theme
- Check browser console for errors

### Database errors?

```bash
npx prisma migrate reset
npx prisma migrate dev --name init
npx prisma generate
```

### App not loading?

- Check that `npm run dev` is running
- Verify the tunnel URL is accessible
- Clear browser cache and cookies
- Check Shopify CLI output for errors

## API Reference

### GET `/api/badge?productId={id}`

Fetch badge data for a product.

**Query Parameters:**
- `productId` (required): Shopify product ID

**Response:**
```json
{
  "badge": {
    "name": "NEW",
    "color": "#ef4444"
  }
}
```

For issues or questions:
- Open an issue on GitHub
- Check Shopify App documentation: https://shopify.dev/docs/apps

## Acknowledgments

- Built with [Shopify App Template - Remix](https://github.com/Shopify/shopify-app-template-remix)
- UI components from [Shopify Polaris](https://polaris.shopify.com/)
