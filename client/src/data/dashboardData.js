export const starterTasks = [
  { id: 'task-1', title: 'Review project milestones', time: '10:00 AM', done: false },
  { id: 'task-2', title: 'Prepare weekly update', time: '01:00 PM', done: false },
  { id: 'task-3', title: 'Send notes to the team', time: '03:30 PM', done: true },
];

export const navigationItems = [
  { label: 'Chat', icon: '◉' },
  { label: 'Dashboard', icon: '▦' },
  { label: 'Tasks', icon: '✓' },
  { label: 'Calendar', icon: '▣' },
  { label: 'Notes', icon: '▤' },
  { label: 'Integrations', icon: '⛓' },
  { label: 'Settings', icon: '⚙' },
];

export const integrationItems = [
  { name: 'Slack', mark: 'S', tone: 'slack' },
  { name: 'WhatsApp', mark: '◉', tone: 'whatsapp' },
  { name: 'Gmail', mark: 'M', tone: 'gmail' },
  { name: 'Notion', mark: 'N', tone: 'notion' },
  { name: 'Twitter', mark: 't', tone: 'twitter' },
  { name: 'Instagram', mark: '◎', tone: 'instagram' },
  { name: 'LinkedIn', mark: 'in', tone: 'linkedin' },
];

export const pageDescriptions = {
  Chat: 'Your personal workspace',
  Dashboard: 'A clear view of your day',
  Tasks: 'Keep the important things moving',
  Calendar: 'Your schedule at a glance',
  Notes: 'Ideas, saved in one place',
  Integrations: 'Your connected workspace tools',
  Settings: 'Make the assistant yours',
};
