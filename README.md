# Hlavi Web

A Next.js web application for visualizing and managing hlavi project tasks with interactive timeline and kanban board views.

## Features

- **GitHub OAuth Authentication** - Secure sign-in with GitHub
- **Repository Selection** - Browse and select repositories containing hlavi tasks
- **Timeline View** - Interactive Gantt chart visualization of tasks with dates
- **Kanban Board** - Organize tasks by status in a drag-and-drop interface
- **Task Details** - View comprehensive task information including acceptance criteria
- **Real-time Updates** - React Query for efficient data caching and updates

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js v5 with GitHub OAuth
- **Styling**: Tailwind CSS
- **State Management**: React Context + React Query
- **Timeline**: vis-timeline for Gantt charts
- **GitHub Integration**: Octokit for GitHub API access

## Prerequisites

- Node.js 18+ and npm
- A GitHub account
- A GitHub repository with hlavi tasks (containing `.hlavi/tasks/` directory)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hlavi-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Hlavi Web (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy the **Client Secret**

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXTAUTH_SECRET=your_generated_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

3. Generate a secure secret for `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
hlavi-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   │   └── login/         # Login page
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── timeline/      # Timeline view
│   │   │   ├── board/         # Kanban board
│   │   │   └── tasks/[id]/    # Task detail page
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   └── github/        # GitHub API proxies
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── board/            # Kanban board components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── layout/           # Layout components
│   │   ├── providers/        # Context providers
│   │   ├── tasks/            # Task-related components
│   │   └── timeline/         # Timeline components
│   ├── contexts/             # React contexts
│   │   └── RepositoryContext.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useBoardConfig.ts
│   │   ├── useRepositories.ts
│   │   └── useTasks.ts
│   └── lib/                  # Utility functions
│       ├── auth.ts           # NextAuth configuration
│       ├── github.ts         # GitHub API service
│       ├── types.ts          # TypeScript types
│       └── utils.ts          # Helper functions
├── public/                    # Static assets
├── .env.example              # Environment variables template
├── .env.local                # Local environment variables (gitignored)
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Usage

### 1. Sign In

Click "Sign in with GitHub" on the login page to authenticate with your GitHub account.

### 2. Select a Repository

On the dashboard, select a repository from the dropdown. Only repositories containing a `.hlavi` directory will appear.

### 3. View Tasks

- **Dashboard**: Overview with task statistics
- **Timeline**: Gantt chart showing tasks with start and end dates
- **Board**: Kanban board organized by task status
- **Task Details**: Click any task to view full details and acceptance criteria

## Deployment

### Vercel Deployment

1. Push your code to GitHub

2. Go to [Vercel](https://vercel.com) and import your repository

3. Add environment variables in Vercel project settings:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel domain)

4. Update your GitHub OAuth App:
   - Homepage URL: `https://your-domain.vercel.app`
   - Authorization callback URL: `https://your-domain.vercel.app/api/auth/callback/github`

5. Deploy!

## Development

### Build for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Architecture

### Data Flow

```
User → GitHub OAuth → NextAuth Session → Dashboard
  ↓
Select Repository → API Route → GitHub API → Parse .hlavi/tasks/*.json
  ↓
Task Data → React Query Cache → Timeline/Board Views
  ↓
Click Task → Task Detail Page
```

### Key Design Decisions

- **Standalone Next.js**: No Rust backend dependency for simpler deployment
- **GitHub API Direct Integration**: Reads task JSON files directly from repositories
- **Read-Only (v1)**: No task editing in initial version
- **React Query**: 5-minute cache for efficient data fetching
- **Server-Side Auth**: Access tokens stored securely in NextAuth session

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

### GitHub Data
- `GET /api/github/repos` - List repositories with `.hlavi` directory
- `GET /api/github/tasks?owner={owner}&repo={repo}` - Get all tasks
- `GET /api/github/tasks?owner={owner}&repo={repo}&taskId={id}` - Get single task
- `GET /api/github/board-config?owner={owner}&repo={repo}` - Get board configuration

## Task JSON Structure

Tasks are stored as individual JSON files in `.hlavi/tasks/`:

```json
{
  "id": "HLA1",
  "title": "Task Title",
  "description": "Task description",
  "status": "inprogress",
  "acceptance_criteria": [
    {
      "id": 1,
      "description": "Criterion description",
      "completed": false,
      "created_at": "2026-02-07T13:34:59.857884Z",
      "completed_at": null
    }
  ],
  "created_at": "2026-02-07T13:18:20.962497Z",
  "updated_at": "2026-02-09T15:04:48.248551Z",
  "agent_assigned": false,
  "rejection_reason": null,
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-09-11T00:00:00Z"
}
```

## Future Enhancements

- Task editing (create, update, delete)
- Real-time collaboration with WebSockets
- GitHub webhooks for auto-refresh
- Advanced filtering and search
- Export timeline as PDF/PNG
- Analytics dashboard with burndown charts
- Mobile app

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue on GitHub.
