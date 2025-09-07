# SafeDeal Frontend

A modern React frontend for the SafeDeal escrow platform, built with TypeScript, Vite, and Tailwind CSS.

## Features

- **Modern UI/UX**: Clean, responsive design matching the provided design specifications
- **Authentication**: JWT-based authentication with refresh token handling
- **Escrow Management**: Create, manage, and track escrow transactions
- **Payment Integration**: Chapa payment gateway integration
- **Real-time Chat**: WebSocket-based communication for escrow discussions
- **Wallet Management**: Ethereum wallet creation and management
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **React Hook Form** for form handling
- **Axios** for API communication
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:8080

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update the environment variables in `.env`:
```
VITE_API_URL=http://localhost:8080
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout component
│   ├── LoginModal.tsx  # Authentication modal
│   └── ...
├── pages/              # Page components
│   ├── LandingPage.tsx # Landing page
│   ├── Dashboard.tsx   # User dashboard
│   ├── CreateEscrow.tsx # Escrow creation
│   └── ...
├── store/              # Zustand state management
│   ├── authStore.ts    # Authentication state
│   └── escrowStore.ts  # Escrow state
├── lib/                # Utility functions
│   ├── api.ts          # API client
│   └── utils.ts        # Helper functions
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## Key Features

### Authentication
- Login/Register with email validation
- JWT token management with automatic refresh
- Protected routes
- Session persistence

### Escrow Management
- Create new escrow transactions
- Multi-step form with validation
- Real-time status updates
- Payment integration with Chapa

### Dashboard
- Overview of user's escrows
- Statistics and metrics
- Quick actions and navigation

### Profile Management
- User profile information
- Bank account details
- Ethereum wallet management
- Security settings

## API Integration

The frontend integrates with the following backend services:

- **User Service**: Authentication and profile management
- **Escrow Service**: Escrow creation and management
- **Payment Service**: Payment processing with Chapa
- **Chat Service**: Real-time communication

## Development

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

### State Management
- Zustand for global state
- React Hook Form for form state
- Local storage for persistence

### API Client
- Axios with interceptors
- Automatic token refresh
- Error handling and notifications

## Deployment

The frontend can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist` directory to your hosting service
3. Configure environment variables for production API URL

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test thoroughly before submitting
4. Update documentation as needed

## License

This project is part of the SafeDeal platform.
