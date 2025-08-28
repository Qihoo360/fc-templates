# @refly/layout

A core layout component package for Refly AI Workspace, providing a complete page layout solution. This package adopts a slot-based rendering mode, supporting flexible layout configuration and context management.

## Features

- 🎨 **Diverse Layouts**: Support for primary pages, secondary pages, and application-level layouts
- 🔧 **Slot System**: Flexible slot-based rendering mode for configurable page structures
- 📱 **Responsive Design**: Layout solutions that adapt to different screen sizes
- 🎯 **Context Management**: Layout state management and dynamic updates
- 🛡️ **Error Boundaries**: Integrated Sentry error boundary protection
- 🎪 **Component Library Support**: Built on Ant Design with consistent styling

## Core Components

### AppLayout

Application-level main layout component, including sidebar menu and preview panel.

```tsx
import { AppLayout } from '@refly/layout';

function App() {
  return (
    <AppLayout
      PreviewPanel={<PreviewComponent />}
      Header={<HeaderComponent />}
    >
      <MainContent />
    </AppLayout>
  );
}
```

### PrimaryPageLayout

Primary page layout component, suitable for main functional pages.

```tsx
import { PrimaryPageLayout, PrimaryPageLayoutContextUpdater } from '@refly/layout';

function MyPage() {
  return (
    <PrimaryPageLayout>
      {({ context, onContextChange }) => (
        <>
          <PrimaryPageLayoutContextUpdater
            title="Page Title"
            actions={<Button>Action Button</Button>}
            extra={<div>Extra Content</div>}
            deps={[]}
          />
          <div>Page Content</div>
        </>
      )}
    </PrimaryPageLayout>
  );
}
```

**Configuration Options:**
- `title`: Page title
- `actions`: Action button area
- `extra`: Extra content area
- `fixHeight`: Whether to fix height
- `noPaddingY`: Whether to remove vertical padding
- `noPaddingX`: Whether to remove horizontal padding

### SecondaryPageLayout

Secondary page layout component, suitable for detail pages or sub-functional pages.

```tsx
import { SecondaryPageLayout, SecondaryPageLayoutContextUpdater } from '@refly/layout';

function DetailPage() {
  return (
    <SecondaryPageLayout>
      {({ context, onContextChange }) => (
        <>
          <SecondaryPageLayoutContextUpdater
            title="Detail Page Title"
            desc="Page description information"
            onBack={() => history.back()}
            actions={<Button>Save</Button>}
            deps={[]}
          />
          <div>Detail Page Content</div>
        </>
      )}
    </SecondaryPageLayout>
  );
}
```

**Configuration Options:**
- `title`: Page title
- `desc`: Page description
- `extra`: Extra content area
- `actions`: Action button area
- `onBack`: Back button callback function

### Header

Header component supporting left and right action areas.

```tsx
import { Header } from '@refly/layout';

function MyHeader() {
  return (
    <Header
      leftActions={[
        <Button key="menu">Menu</Button>,
        <div key="title">Title</div>
      ]}
      rightActions={[
        <Button key="save">Save</Button>,
        <Avatar key="avatar" />
      ]}
    />
  );
}
```

### SideMenu

Sidebar menu component (currently basic implementation).

```tsx
import { SideMenu } from '@refly/layout';

function App() {
  return (
    <div>
      <SideMenu />
    </div>
  );
}
```

## Tools and Helpers

### getLayoutSettings

Utility function to get layout settings, supporting dynamic layout configuration based on path conditions.

```tsx
import { getLayoutSettings } from '@refly/layout';

const settings = getLayoutSettings();
// Returns: { hideHeaderActions: boolean, hidePreviewPanel: boolean }
```

### LayoutContainer

Core layout container component providing slot rendering and context management capabilities.

```tsx
import { LayoutContainer } from '@refly/layout';

function CustomLayout() {
  return (
    <LayoutContainer
      slots={{
        header: HeaderComponent,
        content: ContentComponent,
        sidebar: SidebarComponent
      }}
      initialContextValue={{}}
      RenderLayout={CustomRenderLayout}
    />
  );
}
```

## Components

### Available Components

- **RedirectSuspense**: Suspense component for route redirection
- **ShareProjectBtn**: Project sharing button component

## Layout Constraints

### Primary Page Layout Constraints

- Minimum width: `524px`
- Maximum width: `1080px`

### Responsive Support

All layout components support responsive design and can adapt to different screen sizes.

## Tech Stack

- **React**: 18.2.0+
- **TypeScript**: Full type support
- **Ant Design**: 5.20.0+ UI component library
- **React Router**: 6.22.1+ route management
- **Sentry**: Error monitoring and boundary protection

## Usage Examples

### Complete Page Layout Example

```tsx
import { 
  AppLayout, 
  PrimaryPageLayout, 
  PrimaryPageLayoutContextUpdater,
  Header 
} from '@refly/layout';

function Dashboard() {
  return (
    <AppLayout
      PreviewPanel={<PreviewPanel />}
      Header={
        <Header
          leftActions={[<Logo key="logo" />]}
          rightActions={[<UserMenu key="user" />]}
        />
      }
    >
      <PrimaryPageLayout>
        {({ context, onContextChange }) => (
          <>
            <PrimaryPageLayoutContextUpdater
              title="Dashboard"
              actions={
                <div>
                  <Button type="primary">New Project</Button>
                  <Button>Import Project</Button>
                </div>
              }
              deps={[]}
            />
            <div className="grid grid-cols-3 gap-4">
              <ProjectCard />
              <ProjectCard />
              <ProjectCard />
            </div>
          </>
        )}
      </PrimaryPageLayout>
    </AppLayout>
  );
}
```

### Detail Page Layout Example

```tsx
import { 
  SecondaryPageLayout, 
  SecondaryPageLayoutContextUpdater 
} from '@refly/layout';

function ProjectDetail({ projectId }) {
  return (
    <SecondaryPageLayout>
      {({ context, onContextChange }) => (
        <>
          <SecondaryPageLayoutContextUpdater
            title="Project Details"
            desc="View and edit project information"
            onBack={() => navigate('/projects')}
            actions={
              <Button type="primary">Save Changes</Button>
            }
            deps={[projectId]}
          />
          <ProjectForm projectId={projectId} />
        </>
      )}
    </SecondaryPageLayout>
  );
}
```

## Development Guide

### Extending Layout Components

1. Create new layout components
2. Use `LayoutContainer` as the foundation
3. Define layout context interfaces
4. Implement rendering logic

### Adding New Header Components

1. Create new components in the `src/header/widget/` directory
2. Export components to `src/index.ts`
3. Use in Header component

### Custom Layout Settings

Add new conditional configurations in `getLayoutSettings.tsx`:

```tsx
const LAYOUT_SETTINGS_BY_CONDITION = [
  {
    when: () => /^\/new-path/.test(window.location.pathname),
    setting: {
      hideHeaderActions: true,
      // Other settings
    },
  },
];
``
