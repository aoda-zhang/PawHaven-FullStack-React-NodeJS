import { useState } from 'react';
import {
  MapPin,
  Clock,
  AlertTriangle,
  Heart,
  Search,
  Bell,
  User,
  Camera,
  ArrowLeft,
  Check,
  Share2,
  Star,
  Award,
  X,
  Menu,
  Map,
  List,
  Upload,
  Shield,
  ThumbsUp,
  Plus,
  Bookmark,
  ChevronRight,
  Home,
  BookOpen,
  Zap,
  Edit3,
  Eye,
  Send,
  FileText,
  Tag,
  AlertCircle,
  Pill,
  LogIn,
  CalendarDays,
  Stethoscope,
  Package,
  Save,
  Github,
  Twitter,
  Instagram,
  ChevronDown,
  LogOut,
  MessageCircle,
} from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import heroRescueImg from '../imports/hero-rescue.jpg';

// ─── Types ────────────────────────────────────────────────────
type Page =
  | 'home'
  | 'case-detail'
  | 'report'
  | 'adopt'
  | 'profile'
  | 'stories'
  | 'knowledge';
type AnimalType = 'cat' | 'dog';
type CaseStatus =
  | 'pending'
  | 'in-progress'
  | 'treated'
  | 'recovering'
  | 'awaiting-adoption'
  | 'adopted'
  | 'failed';
type Urgency = 'normal' | 'high';

interface TimelineEvent {
  id: string;
  status: string;
  time: string;
  date: string;
  description: string;
  actor: string;
  photo?: string;
}

interface RescueCase {
  id: string;
  title: string;
  animalType: AnimalType;
  status: CaseStatus;
  urgency: Urgency;
  location: string;
  distance: string;
  timeAgo: string;
  photo: string;
  reporter: string;
  description: string;
  volunteer?: string;
  volunteerRescues?: number;
  timeline: TimelineEvent[];
}

interface AdoptableAnimal {
  id: string;
  name: string;
  animalType: AnimalType;
  age: string;
  sex: string;
  breed: string;
  location: string;
  waitingDays: number;
  tags: string[];
  photo: string;
  rescuedFrom: string;
  rescueDuration: string;
  medicalRecords: string[];
  temperament: string;
}

// ─── Mock Data ────────────────────────────────────────────────
const mockCases: RescueCase[] = [
  {
    id: 'PAW-0421',
    title: 'Injured White Cat',
    animalType: 'cat',
    status: 'in-progress',
    urgency: 'high',
    location: 'Garden Road, Chaoyang District',
    distance: '2.1 km',
    timeAgo: '35 min ago',
    photo:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=500&fit=crop&auto=format',
    reporter: 'Anonymous',
    description:
      'White cat with injured right hind leg. Hiding under a parked car near the bus stop at Garden Road. Seems wary of people but does not appear aggressive. Has been there for at least 2 hours.',
    volunteer: 'Li Ming',
    volunteerRescues: 12,
    timeline: [
      {
        id: 't3',
        status: 'IN PROGRESS',
        time: '14:30',
        date: 'Today',
        description:
          'Cat secured in carrier. Transporting to Love Pet Clinic on Jianguomen Street.',
        actor: 'Li Ming, Volunteer',
        photo:
          'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=400&h=300&fit=crop&auto=format',
      },
      {
        id: 't2',
        status: 'IN PROGRESS',
        time: '14:05',
        date: 'Today',
        description:
          "I'm at Garden Road. Located the cat under the third parked car near the bus stop. Setting up carrier and bait. She looks frightened but not aggressive.",
        actor: 'Li Ming, Volunteer',
      },
      {
        id: 't1',
        status: 'PENDING',
        time: '08:15',
        date: 'Today',
        description:
          'Case reported. White cat with injured hind leg spotted near bus stop. 12 volunteers and 2 shelters notified.',
        actor: 'Anonymous Reporter',
      },
    ],
  },
  {
    id: 'PAW-0418',
    title: 'Stray Brown Dog',
    animalType: 'dog',
    status: 'pending',
    urgency: 'normal',
    location: 'Oak Avenue, Haidian District',
    distance: '3.5 km',
    timeAgo: '1 hr ago',
    photo:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop&auto=format',
    reporter: 'Zhang Wei',
    description:
      'Medium-sized brown dog wandering near the park entrance on Oak Avenue. Appears malnourished but friendly — came up to me when I knelt down. No collar.',
    timeline: [
      {
        id: 't1',
        status: 'PENDING',
        time: '13:10',
        date: 'Today',
        description:
          'Case reported. Brown dog spotted near Oak Avenue park entrance. 8 volunteers notified.',
        actor: 'Zhang Wei',
      },
    ],
  },
  {
    id: 'PAW-0415',
    title: 'Newborn Kittens Found',
    animalType: 'cat',
    status: 'pending',
    urgency: 'high',
    location: 'Pine Street, Xicheng District',
    distance: '0.8 km',
    timeAgo: '2 hrs ago',
    photo:
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&h=500&fit=crop&auto=format',
    reporter: 'Liu Yan',
    description:
      '3 newborn kittens found under a dumpster on Pine Street, behind the flower market. No mother in sight for over 90 minutes. Eyes still closed — extremely vulnerable. Urgent help needed.',
    timeline: [
      {
        id: 't1',
        status: 'PENDING',
        time: '12:00',
        date: 'Today',
        description:
          '3 newborn kittens found under a dumpster. No mother visible. Marked URGENT. 15 volunteers and 3 shelters notified.',
        actor: 'Liu Yan',
      },
    ],
  },
  {
    id: 'PAW-0409',
    title: 'Senior Golden Retriever',
    animalType: 'dog',
    status: 'recovering',
    urgency: 'normal',
    location: 'Maple Lane, Dongcheng District',
    distance: '5.2 km',
    timeAgo: '6 days ago',
    photo:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=500&fit=crop&auto=format',
    reporter: 'Wang Fang',
    description:
      'Elderly golden retriever found limping near the temple. Estimated 10+ years old. Very gentle and well-trained — likely lost rather than abandoned.',
    volunteer: 'Chen Xiaomei',
    volunteerRescues: 28,
    timeline: [
      {
        id: 't4',
        status: 'RECOVERING',
        time: '09:00',
        date: 'Day 4',
        description:
          'Day 4 update — Golden is eating well and tail is wagging again! Right front leg healing nicely. Behavioral assessment started: very gentle, responds to basic commands.',
        actor: 'Happy Paws Shelter',
        photo:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
      },
      {
        id: 't3',
        status: 'TREATED',
        time: '15:30',
        date: 'Day 2',
        description:
          'Initial treatment completed at Beijing Veterinary Hospital. Sprained right front leg, no fractures. Vaccinations updated. Dog is estimated 9–11 years old.',
        actor: 'Chen Xiaomei, Volunteer',
      },
      {
        id: 't2',
        status: 'IN PROGRESS',
        time: '11:00',
        date: 'Day 1',
        description:
          'Retrieved dog from Maple Lane. He walked right over to me. Very calm in the car. Taking to vet now.',
        actor: 'Chen Xiaomei, Volunteer',
      },
      {
        id: 't1',
        status: 'PENDING',
        time: '08:40',
        date: 'Day 1',
        description:
          'Elderly golden retriever reported near Dongcheng Temple area. 10 volunteers notified.',
        actor: 'Wang Fang',
      },
    ],
  },
];

const mockAdoptable: AdoptableAnimal[] = [
  {
    id: 'A001',
    name: 'Snowflake',
    animalType: 'cat',
    age: '~1 year',
    sex: 'Female (spayed)',
    breed: 'Domestic Shorthair',
    location: 'Happy Paws Shelter · Chaoyang',
    waitingDays: 3,
    tags: ['Gentle', 'Litter-trained', 'Good with children'],
    photo:
      'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=600&h=400&fit=crop&auto=format',
    rescuedFrom: 'Garden Road',
    rescueDuration: '32 days',
    medicalRecords: [
      'Rabies vaccine',
      'Deworming',
      'Spayed',
      'FIV/FeLV negative',
    ],
    temperament:
      'Gentle and seeks human attention. Purrs readily. Good with other cats.',
  },
  {
    id: 'A002',
    name: 'Caramel',
    animalType: 'dog',
    age: '~2 years',
    sex: 'Male (neutered)',
    breed: 'Labrador Mix',
    location: 'Sunshine Shelter · Haidian',
    waitingDays: 12,
    tags: ['Playful', 'Leash-trained', 'Good with dogs'],
    photo:
      'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&h=400&fit=crop&auto=format',
    rescuedFrom: 'Zhongguancun Plaza',
    rescueDuration: '45 days',
    medicalRecords: [
      'Rabies vaccine',
      'Deworming',
      'Neutered',
      'Distemper vaccine',
    ],
    temperament:
      'Energetic and friendly. Loves fetch. Gets along well with other dogs.',
  },
  {
    id: 'A003',
    name: 'Mochi',
    animalType: 'cat',
    age: '~3 months',
    sex: 'Male',
    breed: 'Domestic Shorthair',
    location: 'Happy Paws Shelter · Chaoyang',
    waitingDays: 7,
    tags: ['Playful', 'Curious', 'Bottle-fed'],
    photo:
      'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=600&h=400&fit=crop&auto=format',
    rescuedFrom: 'Pine Street',
    rescueDuration: '21 days',
    medicalRecords: ['First vaccines', 'Deworming', 'Healthy'],
    temperament:
      'Curious and playful. Has been socialized with humans from birth. Will need plenty of attention.',
  },
  {
    id: 'A004',
    name: 'Luna',
    animalType: 'dog',
    age: '~4 years',
    sex: 'Female (spayed)',
    breed: 'Border Collie Mix',
    location: 'Green Hope Shelter · Dongcheng',
    waitingDays: 28,
    tags: ['Intelligent', 'Active', 'Needs space'],
    photo:
      'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600&h=400&fit=crop&auto=format',
    rescuedFrom: 'Olympic Park',
    rescueDuration: '60 days',
    medicalRecords: [
      'Full vaccine course',
      'Spayed',
      'Dental cleaning',
      'Hip X-ray normal',
    ],
    temperament:
      'Highly intelligent and alert. Needs an active family with space. Best as only dog.',
  },
];

const mockStories = [
  {
    id: 'S001',
    title: "From a Puddle to a Palace: Biscuit's Journey",
    excerpt:
      "Found soaking wet in a parking lot during a storm, Biscuit couldn't have known that 47 days later he'd be sleeping on a cashmere blanket in his forever home.",
    photoBefore:
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&auto=format',
    photoAfter:
      'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&h=400&fit=crop&auto=format',
    author: 'Chen Xiaomei & Family',
    likes: 284,
    duration: '47 days',
    volunteers: 3,
    date: 'June 12, 2025',
  },
  {
    id: 'S002',
    title: 'Three Kittens, One Miracle Night',
    excerpt:
      "When Liu Yan found three newborns under a dumpster on a freezing December night, she didn't hesitate. What happened next changed four lives forever.",
    photoBefore:
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=400&fit=crop&auto=format',
    photoAfter:
      'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=600&h=400&fit=crop&auto=format',
    author: 'Liu Yan & Wang Fang',
    likes: 512,
    duration: '62 days',
    volunteers: 5,
    date: 'May 28, 2025',
  },
  {
    id: 'S003',
    title: 'The Old Golden Who Remembered Home',
    excerpt:
      'A 10-year-old golden retriever, lost and limping near a temple. Five volunteers. Twelve days. And a family who never stopped searching.',
    photoBefore:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop&auto=format',
    photoAfter:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
    author: 'The Zhang Family',
    likes: 731,
    duration: '12 days',
    volunteers: 5,
    date: 'April 3, 2025',
  },
];

// ─── Status Helpers ───────────────────────────────────────────
const statusMeta: Record<
  CaseStatus,
  { label: string; pill: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    pill: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  'in-progress': {
    label: 'In Progress',
    pill: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  treated: {
    label: 'Treated',
    pill: 'bg-indigo-100 text-indigo-800',
    dot: 'bg-indigo-600',
  },
  recovering: {
    label: 'Recovering',
    pill: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
  },
  'awaiting-adoption': {
    label: 'Awaiting Adoption',
    pill: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-400',
  },
  adopted: {
    label: 'Adopted',
    pill: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-600',
  },
  failed: {
    label: 'Ended',
    pill: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-400',
  },
};

function StatusBadge({ status }: { status: CaseStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function UrgencyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
      <AlertTriangle className="h-3 w-3" />
      Urgent
    </span>
  );
}

// ─── NavBar ───────────────────────────────────────────────────
function NavBar({
  page,
  navigate,
  menuOpen,
  setMenuOpen,
  isLoggedIn,
  onAuthOpen,
  onSignOut,
}: {
  page: Page;
  navigate: (p: Page) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  isLoggedIn: boolean;
  onAuthOpen: (mode: 'signin' | 'signup') => void;
  onSignOut: () => void;
}) {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const links: { label: string; page: Page; icon: React.ReactNode }[] = [
    { label: 'Rescues', page: 'home', icon: <Home className="h-4 w-4" /> },
    { label: 'Adopt', page: 'adopt', icon: <Heart className="h-4 w-4" /> },
    {
      label: 'Knowledge',
      page: 'knowledge',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      label: 'Stories',
      page: 'stories',
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  return (
    <nav
      className="border-border sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(255,250,245,0.88)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="group flex items-center gap-2"
        >
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-105">
            <span className="text-base text-white">🐾</span>
          </div>
          <span
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-foreground text-xl font-bold"
          >
            PawHaven
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.page}
              onClick={() => navigate(l.page)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                page === l.page
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {l.icon}
              {l.label}
            </button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <>
              <button className="text-muted-foreground hover:text-foreground hover:bg-muted relative rounded-lg p-2 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>
              <button
                onClick={() => navigate('report')}
                className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Report Stray
              </button>
              {/* Avatar dropdown */}
              <div className="relative">
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="hover:bg-muted flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-400 text-sm font-bold text-white">
                    L
                  </div>
                  <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
                </button>
                {avatarOpen && (
                  <div className="bg-card border-border absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border py-1 shadow-lg">
                    <div className="border-border border-b px-3 py-2">
                      <p className="text-foreground text-sm font-semibold">
                        Li Ming
                      </p>
                      <p className="text-muted-foreground text-xs">
                        li.ming@email.com
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('profile');
                        setAvatarOpen(false);
                      }}
                      className="text-foreground hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                    >
                      <User className="h-4 w-4" /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('knowledge');
                        setAvatarOpen(false);
                      }}
                      className="text-foreground hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                    >
                      <Edit3 className="h-4 w-4" /> My Articles
                    </button>
                    <div className="border-border mt-1 border-t pt-1">
                      <button
                        onClick={() => {
                          onSignOut();
                          setAvatarOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => onAuthOpen('signin')}
              className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="text-muted-foreground hover:text-foreground rounded-lg p-2 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-border bg-card flex flex-col gap-1 border-t px-4 py-3 md:hidden">
          {links.map((l) => (
            <button
              key={l.page}
              onClick={() => navigate(l.page)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                page === l.page
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {l.icon} {l.label}
            </button>
          ))}
          {isLoggedIn ? (
            <button
              onClick={() => navigate('report')}
              className="bg-primary text-primary-foreground mt-2 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Report Stray
            </button>
          ) : (
            <button
              onClick={() => {
                onAuthOpen('signin');
                setMenuOpen(false);
              }}
              className="bg-primary text-primary-foreground mt-2 w-full rounded-lg py-2.5 text-sm font-semibold"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

// ─── HomePage ─────────────────────────────────────────────────
function HomePage({
  navigate,
  openCase,
  requireAuth,
}: {
  navigate: (p: Page) => void;
  openCase: (id: string) => void;
  requireAuth: (then: () => void) => void;
}) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'in-progress' | 'recovering'
  >('all');

  const filtered =
    filter === 'all' ? mockCases : mockCases.filter((c) => c.status === filter);

  return (
    <main>
      {/* Hero */}
      {/* ── Hero — reference: flat cream bg, large serif headline, dark CTA, horizontal stats, photo flush right ── */}
      <section style={{ background: '#f5ede3' }} className="overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex min-h-[520px] items-stretch">
            {/* Left column */}
            <div className="flex flex-1 flex-col justify-center py-16 pr-10">
              {/* Live pill */}
              <div className="text-primary mb-7 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase">
                <ChevronRight className="h-3 w-3" />
                {mockCases.filter((c) => c.status === 'pending').length *
                  41}{' '}
                rescues in progress right now
              </div>

              {/* Big serif headline */}
              <h1
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  lineHeight: 1.08,
                }}
                className="mb-6 text-[3rem] font-bold text-[#1c1a17] md:text-[3.75rem] lg:text-[4.25rem]"
              >
                Every stray life <br />
                <span className="text-primary italic">deserves</span> to be
                seen.
              </h1>

              <p className="mb-9 max-w-[380px] text-[15px] leading-relaxed text-[#6b6258]">
                PawHaven is a collaboration network for reporters, rescuers,
                clinics and adopters — turning fragmented cries for help into a
                transparent rescue pipeline.
              </p>

              {/* CTAs */}
              <div className="mb-12 flex items-center gap-3">
                <button
                  onClick={() => requireAuth(() => navigate('report'))}
                  className="flex items-center gap-2 rounded-xl bg-[#1c1a17] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                >
                  Report a stray now
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('adopt')}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-[#1c1a17] transition-all hover:underline"
                >
                  Meet adoptable pets
                </button>
              </div>

              {/* Horizontal stats — no boxes, just numbers + dividers */}
              <div className="flex items-center gap-0 divide-x divide-[#d4c4b4]">
                {[
                  { value: '8,412', label: 'Rescues completed' },
                  { value: '3,207', label: 'Adopted homes' },
                  { value: '1,940', label: 'Active volunteers' },
                ].map((s) => (
                  <div key={s.label} className="px-6 first:pl-0">
                    <div
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                      className="mb-0.5 text-[1.75rem] leading-none font-bold text-[#1c1a17]"
                    >
                      {s.value}
                    </div>
                    <div className="text-xs text-[#9e8e82]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — photo flush to edge, no padding */}
            <div className="relative hidden w-[46%] flex-shrink-0 lg:block">
              <ImageWithFallback
                src={heroRescueImg}
                alt="Volunteer holding rescued cat and dog at shelter"
                className="h-full w-full object-cover"
              />
              {/* "Just Adopted" floating card */}
              <div className="absolute right-6 bottom-8 flex items-center gap-3 rounded-2xl border border-white/60 bg-white px-4 py-3 shadow-xl">
                <div className="bg-muted h-9 w-9 flex-shrink-0 overflow-hidden rounded-full">
                  <img
                    src="https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=72&h=72&fit=crop&auto=format"
                    alt="Mochi"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-primary mb-0.5 text-[10px] leading-none font-bold tracking-wider uppercase">
                    Just Adopted 🏠
                  </p>
                  <p className="text-xs font-semibold text-[#1c1a17]">
                    Mochi found her home
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rescue Cases */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Header row */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground text-2xl font-bold"
            >
              Rescue Cases
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {mockCases.filter((c) => c.status === 'pending').length} pending ·{' '}
              {mockCases.filter((c) => c.status === 'in-progress').length} in
              progress
            </p>
          </div>
          {/* View toggle */}
          <div className="bg-card border-border flex items-center gap-1 rounded-lg border p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              Map
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto pb-1">
          {(['all', 'pending', 'in-progress', 'recovering'] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted border'
                }`}
              >
                {f === 'all'
                  ? 'All Cases'
                  : f === 'in-progress'
                    ? 'In Progress'
                    : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ),
          )}
        </div>

        {/* Map view */}
        {viewMode === 'map' && (
          <div
            className="border-border relative mb-6 overflow-hidden rounded-2xl border bg-[#e8e0d8] shadow-md"
            style={{ height: 420 }}
          >
            <img
              src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1200&h=600&fit=crop&auto=format"
              alt="City map"
              className="h-full w-full object-cover opacity-40"
            />
            {/* Map pins */}
            <div className="absolute inset-0">
              {/* Urgent pin */}
              <div className="absolute" style={{ top: '28%', left: '38%' }}>
                <div className="relative">
                  <div
                    className="flex h-10 w-10 animate-bounce cursor-pointer items-center justify-center rounded-full border-4 border-white bg-red-500 text-sm text-white shadow-lg"
                    onClick={() => openCase('PAW-0421')}
                  >
                    🐱
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full border-2 border-white bg-red-500" />
                  <div className="absolute top-11 left-1/2 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-xs font-semibold whitespace-nowrap text-red-700 shadow-md">
                    PAW-0421 · Urgent
                  </div>
                </div>
              </div>
              {/* Normal pins */}
              <div className="absolute" style={{ top: '55%', left: '60%' }}>
                <div
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-amber-500 text-sm text-white shadow-lg transition-transform hover:scale-110"
                  onClick={() => openCase('PAW-0418')}
                >
                  🐕
                </div>
              </div>
              <div className="absolute" style={{ top: '38%', left: '22%' }}>
                <div className="relative">
                  <div
                    className="flex h-10 w-10 animate-bounce cursor-pointer items-center justify-center rounded-full border-4 border-white bg-red-500 text-sm text-white shadow-lg"
                    onClick={() => openCase('PAW-0415')}
                  >
                    🐱
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full border-2 border-white bg-red-500" />
                </div>
              </div>
              <div className="absolute" style={{ top: '65%', left: '72%' }}>
                <div
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-green-500 text-sm text-white shadow-lg transition-transform hover:scale-110"
                  onClick={() => openCase('PAW-0409')}
                >
                  🐕
                </div>
              </div>
            </div>
            {/* Map legend */}
            <div className="border-border absolute right-4 bottom-4 rounded-xl border bg-white/90 p-3 shadow-md backdrop-blur-sm">
              <div className="text-foreground mb-2 text-xs font-semibold">
                Legend
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { color: 'bg-red-500', label: 'Urgent' },
                  { color: 'bg-amber-500', label: 'Pending' },
                  { color: 'bg-green-500', label: 'In Progress' },
                ].map((l) => (
                  <div
                    key={l.label}
                    className="text-muted-foreground flex items-center gap-2 text-xs"
                  >
                    <div className={`h-3 w-3 rounded-full ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {filtered.map((c) => (
              <CaseCard key={c.id} rescue={c} onOpen={() => openCase(c.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Adoptable Animals strip */}
      <section className="border-border bg-muted/50 border-t border-b py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                className="text-foreground text-2xl font-bold"
              >
                Ready for a Forever Home
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                These animals completed their rescue journey and are waiting for
                you.
              </p>
            </div>
            <button
              onClick={() => navigate('adopt')}
              className="text-primary hidden items-center gap-1.5 text-sm font-medium hover:underline sm:flex"
            >
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div
            className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {mockAdoptable.map((a) => (
              <div
                key={a.id}
                className="bg-background border-border w-64 flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => navigate('adopt')}
              >
                <div className="bg-muted relative h-44">
                  <img
                    src={a.photo}
                    alt={a.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Adoptable
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-400 backdrop-blur-sm transition-colors hover:text-red-500">
                    <Heart className="h-4 w-4" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-1 flex items-start justify-between">
                    <h3
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                      className="text-foreground text-base font-semibold"
                    >
                      {a.name}
                    </h3>
                    <span className="text-lg">
                      {a.animalType === 'cat' ? '🐱' : '🐕'}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-2 text-xs">
                    {a.age} · {a.sex}
                  </p>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {a.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    Waiting {a.waitingDays} days
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Stories */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground text-2xl font-bold"
            >
              Happy Endings
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Every rescue is a story worth sharing.
            </p>
          </div>
          <button
            onClick={() => navigate('stories')}
            className="text-primary hidden items-center gap-1.5 text-sm font-medium hover:underline sm:flex"
          >
            All stories <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockStories.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              onClick={() => navigate('stories')}
            />
          ))}
        </div>
      </section>

      {/* Knowledge strip — from product strategy: homepage should surface knowledge base */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground text-2xl font-bold"
            >
              Rescue Knowledge
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Professional guides reviewed by veterinarians and certified
              rescuers.
            </p>
          </div>
          <button
            onClick={() => navigate('knowledge')}
            className="text-primary hidden items-center gap-1.5 text-sm font-medium hover:underline sm:flex"
          >
            Full library <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockArticles
            .filter((a) => a.status === 'published')
            .slice(0, 3)
            .map((a) => {
              const cat = knowledgeCategories.find((c) => c.id === a.category)!;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate('knowledge')}
                  className="border-border bg-card rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-muted-foreground text-xs font-semibold">
                      {cat.label}
                    </span>
                  </div>
                  <h3 className="text-foreground mb-1 text-sm leading-snug font-semibold">
                    {a.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                    {a.excerpt}
                  </p>
                  <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    {a.readTime} min
                    <Eye className="ml-1 h-3 w-3" />
                    {a.views.toLocaleString()}
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      {/* Footer CTA */}
      <section
        className="border-border mt-4 border-t py-14"
        style={{
          background: 'linear-gradient(135deg, #4a392c 0%, #6b5642 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="mb-4 text-4xl">🐾</div>
          <h2
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="mb-3 text-3xl font-bold text-white"
          >
            See a stray animal? You can help.
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-base text-[#d3c3b3]">
            A 60-second report on PawHaven puts trained volunteers in motion.
            You don't need any special skills — just a phone.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate('report')}
              className="bg-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            >
              <Camera className="h-4 w-4" />
              Report a Stray
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20">
              <Zap className="h-4 w-4" />
              Become a Volunteer
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── CaseCard ─────────────────────────────────────────────────
function CaseCard({
  rescue,
  onOpen,
}: {
  rescue: RescueCase;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="bg-card border-border group cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="bg-muted relative h-48 overflow-hidden">
        <img
          src={rescue.photo}
          alt={rescue.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge status={rescue.status} />
          {rescue.urgency === 'high' && <UrgencyBadge />}
        </div>
        <div className="absolute right-3 bottom-3 left-3">
          <h3
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-lg leading-tight font-semibold text-white drop-shadow"
          >
            {rescue.title}
          </h3>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start gap-2">
          <MapPin className="text-muted-foreground mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-muted-foreground text-xs">
            {rescue.location}
          </span>
        </div>
        <p className="text-foreground/80 mb-3 line-clamp-2 text-sm">
          {rescue.description}
        </p>
        <div className="border-border flex items-center justify-between border-t pt-3">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            {rescue.timeAgo}
          </div>
          {rescue.distance && (
            <div className="text-primary bg-accent flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
              <MapPin className="h-3 w-3" />
              {rescue.distance}
            </div>
          )}
          {rescue.volunteer && (
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
              {rescue.volunteer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StoryCard ────────────────────────────────────────────────
function StoryCard({
  story,
  onClick,
}: {
  story: (typeof mockStories)[0];
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-card border-border group cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="bg-muted relative h-48 overflow-hidden">
        <img
          src={story.photoBefore}
          alt={story.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute right-3 bottom-3 left-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <ThumbsUp className="h-3.5 w-3.5 text-white/80" />
            <span className="text-xs text-white/80">
              {story.likes} people loved this story
            </span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          className="text-foreground group-hover:text-primary mb-2 text-base leading-snug font-semibold transition-colors"
        >
          {story.title}
        </h3>
        <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
          {story.excerpt}
        </p>
        <div className="border-border text-muted-foreground flex items-center justify-between border-t pt-3 text-xs">
          <span className="text-foreground font-medium">{story.author}</span>
          <div className="flex items-center gap-3">
            <span>{story.duration} rescue</span>
            <span>{story.volunteers} volunteers</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CaseDetailPage ───────────────────────────────────────────
function CaseDetailPage({
  rescue,
  navigate,
  isLoggedIn,
  onAuthRequired,
}: {
  rescue: RescueCase;
  navigate: (p: Page) => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}) {
  const [claimed, setClaimed] = useState(rescue.volunteer != null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [followed, setFollowed] = useState(false);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Back */}
      <button
        onClick={() => navigate('home')}
        className="text-muted-foreground hover:text-foreground group mb-6 flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to all cases
      </button>

      {/* Hero image */}
      <div className="bg-muted relative mb-6 h-64 overflow-hidden rounded-2xl shadow-md md:h-80">
        <img
          src={rescue.photo}
          alt={rescue.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <StatusBadge status={rescue.status} />
          {rescue.urgency === 'high' && <UrgencyBadge />}
        </div>
        <div className="absolute right-4 bottom-4 left-4">
          <p className="mb-1 text-xs text-white/70">Case #{rescue.id}</p>
          <h1
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-2xl leading-tight font-bold text-white md:text-3xl"
          >
            {rescue.title}
          </h1>
          <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
            <MapPin className="h-3.5 w-3.5" />
            {rescue.location}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Description */}
          <div className="bg-card border-border rounded-2xl border p-5 shadow-sm">
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground mb-3 text-lg font-semibold"
            >
              What was reported
            </h2>
            <p className="text-foreground/80 mb-4 text-sm leading-relaxed">
              {rescue.description}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-xl p-3">
                <div className="text-muted-foreground mb-1 text-xs">Animal</div>
                <div className="font-medium">
                  {rescue.animalType === 'cat' ? '🐱 Cat' : '🐕 Dog'}
                </div>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <div className="text-muted-foreground mb-1 text-xs">
                  Reported by
                </div>
                <div className="font-medium">{rescue.reporter}</div>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <div className="text-muted-foreground mb-1 text-xs">
                  Reported
                </div>
                <div className="font-medium">{rescue.timeAgo}</div>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <div className="text-muted-foreground mb-1 text-xs">
                  Distance
                </div>
                <div className="font-medium">{rescue.distance}</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card border-border rounded-2xl border p-5 shadow-sm">
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground mb-5 text-lg font-semibold"
            >
              Rescue Timeline
            </h2>
            <div className="relative">
              <div className="bg-border absolute top-2 bottom-0 left-4 w-0.5" />
              <div className="flex flex-col gap-5">
                {rescue.timeline.map((event, idx) => (
                  <div key={event.id} className="flex gap-4">
                    <div
                      className={`z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        idx === 0
                          ? 'bg-primary border-primary text-white'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {idx === 0 ? (
                        <Zap className="h-4 w-4" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                          {event.status}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {event.date} · {event.time}
                        </span>
                      </div>
                      <p className="text-foreground mb-1 text-sm leading-relaxed">
                        {event.description}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        — {event.actor}
                      </p>
                      {event.photo && (
                        <div className="bg-muted mt-2 h-28 overflow-hidden rounded-xl">
                          <img
                            src={event.photo}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Volunteer action panel */}
          <div className="bg-card border-border rounded-2xl border p-5 shadow-sm">
            {claimed ? (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-foreground text-sm font-semibold">
                      {rescue.volunteer}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {rescue.volunteerRescues} rescues completed
                    </div>
                  </div>
                </div>
                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                  This volunteer is currently handling this rescue. You can
                  offer to assist.
                </div>
                <button className="border-border text-foreground hover:bg-muted w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors">
                  Offer Assistance
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-foreground text-sm font-medium">
                    No volunteer yet
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Be the first to claim this case
                  </p>
                </div>
                <button
                  onClick={() =>
                    isLoggedIn ? setShowClaimModal(true) : onAuthRequired()
                  }
                  className="bg-primary w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                >
                  🙋 I'll Rescue This Animal
                </button>
              </div>
            )}
          </div>

          {/* Follow & Share */}
          <div className="bg-card border-border flex flex-col gap-2 rounded-2xl border p-4 shadow-sm">
            <button
              onClick={() => setFollowed(!followed)}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                followed
                  ? 'bg-accent text-primary border-primary/20 border'
                  : 'border-border text-muted-foreground hover:bg-muted border'
              }`}
            >
              <Bookmark
                className={`h-4 w-4 ${followed ? 'fill-current' : ''}`}
              />
              {followed ? 'Following this case' : 'Follow this case'}
            </button>
            <button className="border-border text-muted-foreground hover:bg-muted flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors">
              <Share2 className="h-4 w-4" />
              Share case
            </button>
          </div>

          {/* Safety note */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
            <strong className="mb-1 block">Safety First</strong>
            Exact GPS location is not shown publicly. Contact the reporter
            through in-app messaging only after claiming.
          </div>

          {/* Contextual knowledge — strategy: auto-recommend based on animal type + urgency */}
          <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
            <p className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <BookOpen className="h-3.5 w-3.5" /> Relevant Guides
            </p>
            <div className="flex flex-col gap-2">
              {mockArticles
                .filter(
                  (a) =>
                    a.status === 'published' &&
                    ((rescue.urgency === 'high' &&
                      a.category === 'emergency') ||
                      (rescue.animalType === 'cat' &&
                        a.category === 'feline') ||
                      (rescue.animalType === 'dog' &&
                        a.category === 'canine') ||
                      a.category === 'process'),
                )
                .slice(0, 3)
                .map((a) => {
                  const cat = knowledgeCategories.find(
                    (c) => c.id === a.category,
                  )!;
                  return (
                    <div
                      key={a.id}
                      className={`rounded-xl border p-2.5 text-left ${cat.bg}`}
                    >
                      <p
                        className={`text-xs leading-snug font-semibold ${cat.color}`}
                      >
                        {cat.emoji} {a.title}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {a.readTime} min read
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Claim modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground mb-2 text-xl font-bold"
            >
              Claim "{rescue.title}"?
            </h3>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              By claiming this case, you are committing to:
            </p>
            <ul className="text-foreground mb-6 flex flex-col gap-2 text-sm">
              {[
                'Go to the reported location',
                'Attempt to rescue the animal',
                'Post status updates',
                'Transfer to vet/shelter if needed',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClaimModal(false)}
                className="border-border text-muted-foreground hover:bg-muted flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setClaimed(true);
                  setShowClaimModal(false);
                }}
                className="bg-primary flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Yes, I'm on it!
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── ReportWizardPage ─────────────────────────────────────────
const STEPS = [
  'Photos',
  'Location',
  'Animal',
  'Condition',
  'Urgency',
  'Confirm',
];

function ReportWizardPage({ navigate }: { navigate: (p: Page) => void }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [animalType, setAnimalType] = useState<'cat' | 'dog' | 'other'>('cat');
  const [urgencyChecks, setUrgencyChecks] = useState<Record<string, boolean>>({
    bleeding: false,
    cantMove: false,
    dangerZone: false,
    breathing: false,
  });

  if (submitted) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="bg-card border-border rounded-2xl border p-8 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-foreground mb-2 text-2xl font-bold"
          >
            Thank you for reporting!
          </h1>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            We've notified <strong>12 volunteers</strong> and{' '}
            <strong>2 shelters</strong> near{' '}
            <strong>Garden Road, Chaoyang District</strong>.
          </p>
          <div className="bg-muted mb-6 rounded-xl p-4 text-left">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-foreground text-sm font-semibold">
                Case #PAW-0424
              </div>
              <StatusBadge status="pending" />
            </div>
            <div className="text-muted-foreground text-xs">
              Reported just now · Awaiting rescue
            </div>
          </div>
          <div className="mb-6 rounded-xl bg-blue-50 p-4 text-left text-sm text-blue-800">
            <strong className="mb-1 block">🔔 What happens next?</strong>
            You'll receive a notification when a volunteer claims this case.
            We'll keep you updated throughout the rescue.
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('home')}
              className="bg-primary rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Track this case
            </button>
            <button
              onClick={() => navigate('home')}
              className="border-border text-muted-foreground hover:bg-muted rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Back to homepage
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate('home')}
        className="text-muted-foreground hover:text-foreground group mb-6 flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Cancel
      </button>

      <h1
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        className="text-foreground mb-1 text-2xl font-bold"
      >
        Report a Stray Animal
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Step {step} of {STEPS.length} — {STEPS[step - 1]}
      </p>

      {/* Progress */}
      <div className="mb-8 flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i + 1 < step
                ? 'bg-primary'
                : i + 1 === step
                  ? 'bg-primary/50'
                  : 'bg-border'
            }`}
          />
        ))}
      </div>

      <div className="bg-card border-border mb-6 rounded-2xl border p-6 shadow-sm">
        {/* Step 1: Photos */}
        {step === 1 && (
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="mb-1 text-lg font-semibold"
            >
              Upload Photos
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              The first photo will be used as the cover. Clear photos help
              volunteers find the animal faster.
            </p>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="bg-muted border-border hover:bg-accent flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors">
                <Camera className="text-muted-foreground mb-1 h-6 w-6" />
                <span className="text-muted-foreground text-xs">
                  Take photo
                </span>
              </div>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-muted border-border hover:bg-accent flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors"
                >
                  <Upload className="text-muted-foreground mb-1 h-5 w-5" />
                  <span className="text-muted-foreground text-xs">
                    Add photo
                  </span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              Up to 5 photos. First = cover image.{' '}
              <span className="text-red-500">Required.</span>
            </p>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="mb-1 text-lg font-semibold"
            >
              Where did you see it?
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              We'll show rescuers the approximate area, not exact coordinates.
            </p>
            <div className="bg-muted border-border relative mb-4 flex h-40 items-center justify-center overflow-hidden rounded-xl border">
              <div className="text-muted-foreground text-center text-sm">
                <MapPin className="text-primary mx-auto mb-2 h-8 w-8" />
                <p className="text-foreground text-xs font-medium">
                  GPS Location Detected
                </p>
                <p className="text-xs">Garden Road, Chaoyang District</p>
              </div>
              <div className="absolute right-2 bottom-2">
                <span className="border-border text-muted-foreground rounded border bg-white px-2 py-0.5 text-xs">
                  Drag to adjust
                </span>
              </div>
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue="Garden Road, near bus stop, Chaoyang District"
                className="border-border bg-background text-foreground focus:ring-primary/30 focus:border-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
              <p className="text-muted-foreground mt-1.5 text-xs">
                Add any landmark details that help rescuers find the exact spot.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Animal Type */}
        {step === 3 && (
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="mb-1 text-lg font-semibold"
            >
              What kind of animal?
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              This helps match the right volunteers with the right expertise.
            </p>
            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                { type: 'cat' as const, emoji: '🐱', label: 'Cat' },
                { type: 'dog' as const, emoji: '🐕', label: 'Dog' },
                { type: 'other' as const, emoji: '🐾', label: 'Other' },
              ].map((a) => (
                <button
                  key={a.type}
                  onClick={() => setAnimalType(a.type)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                    animalType === a.type
                      ? 'border-primary bg-accent text-primary'
                      : 'border-border hover:border-primary/40 hover:bg-muted'
                  }`}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="text-sm font-medium">{a.label}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Approximate count
              </label>
              <div className="flex items-center gap-3">
                <button className="border-border text-muted-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full border text-lg">
                  −
                </button>
                <span className="text-foreground w-10 text-center text-lg font-semibold">
                  1
                </span>
                <button className="border-border text-muted-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full border text-lg">
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Condition */}
        {step === 4 && (
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="mb-1 text-lg font-semibold"
            >
              Describe its condition
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              Optional details help volunteers prepare better.
            </p>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Coat color / Appearance
              </label>
              <input
                type="text"
                placeholder="e.g. White with orange patches, short fur"
                className="border-border bg-background focus:ring-primary/30 focus:border-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Approximate size
              </label>
              <div className="flex gap-2">
                {['Small', 'Medium', 'Large'].map((s) => (
                  <button
                    key={s}
                    className="border-border hover:border-primary hover:bg-accent flex-1 rounded-xl border py-2 text-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Behavior when you saw it
              </label>
              <div className="flex flex-col gap-2">
                {[
                  'Friendly / approached me',
                  'Wary / kept distance',
                  'Aggressive',
                  'Lethargic / unresponsive',
                ].map((b) => (
                  <label
                    key={b}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="behavior"
                      className="accent-primary"
                    />
                    <span className="text-sm">{b}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Urgency */}
        {step === 5 && (
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="mb-1 text-lg font-semibold"
            >
              Urgency Assessment
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              Check all that apply. Any "Yes" triggers an urgent alert to nearby
              volunteers.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { key: 'bleeding', label: 'Visibly bleeding or open wounds' },
                { key: 'cantMove', label: 'Cannot move or stand up' },
                {
                  key: 'dangerZone',
                  label:
                    'In a dangerous location (road, highway, construction)',
                },
                {
                  key: 'breathing',
                  label: 'Appears to have difficulty breathing',
                },
              ].map((u) => (
                <label
                  key={u.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors ${
                    urgencyChecks[u.key]
                      ? 'border-red-300 bg-red-50'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-red-500"
                    checked={urgencyChecks[u.key]}
                    onChange={(e) =>
                      setUrgencyChecks((prev) => ({
                        ...prev,
                        [u.key]: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-foreground text-sm">{u.label}</span>
                </label>
              ))}
            </div>
            {Object.values(urgencyChecks).some(Boolean) && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  This case will be flagged as <strong>URGENT</strong>.
                  Volunteers within 10km will receive a critical alert
                  immediately.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Confirm */}
        {step === 6 && (
          <div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="mb-1 text-lg font-semibold"
            >
              Review & Submit
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              Please confirm the details before submitting.
            </p>
            <div className="bg-muted mb-4 flex gap-3 rounded-xl p-4">
              <div className="bg-border flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg text-2xl">
                🐱
              </div>
              <div>
                <div className="text-foreground text-sm font-semibold">
                  Cat · Garden Road, Chaoyang
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  1 animal · Wary behavior
                </div>
                <div className="mt-1.5">
                  {Object.values(urgencyChecks).some(Boolean) ? (
                    <UrgencyBadge />
                  ) : (
                    <span className="text-muted-foreground bg-border rounded-full px-2 py-0.5 text-xs font-medium">
                      Normal urgency
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">
                Your contact (optional)
              </label>
              <input
                type="text"
                placeholder="Phone or WeChat ID — only shared with the assigned volunteer"
                className="border-border bg-background focus:ring-primary/30 focus:border-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
              By submitting, you agree that the information is accurate to the
              best of your knowledge. Your contact will only be visible to the
              assigned volunteer.
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="border-border text-muted-foreground hover:bg-muted flex-1 rounded-xl border py-3 text-sm font-medium transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={() => {
            if (step < 6) setStep((s) => s + 1);
            else setSubmitted(true);
          }}
          className="bg-primary flex-1 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
        >
          {step === 6 ? 'Submit Report' : 'Continue'}
        </button>
      </div>
    </main>
  );
}

// ─── AdoptionPage ─────────────────────────────────────────────
function AdoptionPage({
  navigate,
  isLoggedIn,
  onAuthRequired,
}: {
  navigate: (p: Page) => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'cat' | 'dog'>('all');
  const [selectedAnimal, setSelectedAnimal] = useState<AdoptableAnimal | null>(
    null,
  );
  const [applyOpen, setApplyOpen] = useState(false);

  const filtered =
    filter === 'all'
      ? mockAdoptable
      : mockAdoptable.filter((a) => a.animalType === filter);

  if (selectedAnimal) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <button
          onClick={() => setSelectedAnimal(null)}
          className="text-muted-foreground hover:text-foreground group mb-6 flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to adoptions
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            {/* Hero */}
            <div className="bg-muted h-72 overflow-hidden rounded-2xl shadow-md">
              <img
                src={selectedAnimal.photo}
                alt={selectedAnimal.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Quick info */}
            <div className="bg-card border-border rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    className="text-foreground text-2xl font-bold"
                  >
                    {selectedAnimal.name}
                  </h1>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {selectedAnimal.location}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                  Available ✓
                </span>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Age', value: selectedAnimal.age },
                  { label: 'Sex', value: selectedAnimal.sex },
                  { label: 'Breed', value: selectedAnimal.breed },
                  { label: 'Rescued from', value: selectedAnimal.rescuedFrom },
                ].map((info) => (
                  <div key={info.label} className="bg-muted rounded-xl p-3">
                    <div className="text-muted-foreground mb-0.5 text-xs">
                      {info.label}
                    </div>
                    <div className="text-foreground font-medium">
                      {info.value}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Temperament
                </div>
                <p className="text-foreground text-sm leading-relaxed">
                  {selectedAnimal.temperament}
                </p>
              </div>
            </div>

            {/* Medical records */}
            <div className="bg-card border-border rounded-2xl border p-5 shadow-sm">
              <h2
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                className="text-foreground mb-4 text-lg font-semibold"
              >
                Medical Records
              </h2>
              <div className="flex flex-col gap-2">
                {selectedAnimal.medicalRecords.map((rec) => (
                  <div key={rec} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="text-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {selectedAnimal.tags.map((t) => (
                <span
                  key={t}
                  className="bg-accent text-accent-foreground rounded-full px-3 py-1.5 text-sm font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-card border-border rounded-2xl border p-5 shadow-sm">
              <div className="text-muted-foreground mb-4 flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4" />
                Waiting {selectedAnimal.waitingDays} days for a home
              </div>
              <button
                onClick={() =>
                  isLoggedIn ? setApplyOpen(true) : onAuthRequired()
                }
                className="bg-primary mb-2 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              >
                💌 Apply to Adopt {selectedAnimal.name}
              </button>
              <button className="border-border text-muted-foreground hover:bg-muted w-full rounded-xl border py-2.5 text-sm font-medium transition-colors">
                <Bookmark className="mr-1.5 inline h-4 w-4" />
                Save for later
              </button>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
              <strong className="mb-1 block">
                ⚠️ Adoption is a 15+ year commitment.
              </strong>
              Please consider carefully. The shelter will review your
              application and may schedule a home visit.
            </div>
            <div className="bg-muted text-muted-foreground rounded-2xl p-4 text-xs leading-relaxed">
              <strong className="text-foreground mb-1 block">
                Rescue duration:
              </strong>
              {selectedAnimal.name} was rescued from{' '}
              {selectedAnimal.rescuedFrom} and took{' '}
              {selectedAnimal.rescueDuration} to reach this point.
            </div>
          </div>
        </div>

        {/* Adoption application modal */}
        {applyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
            <div className="bg-card my-4 w-full max-w-md rounded-2xl p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  className="text-xl font-bold"
                >
                  Adopt {selectedAnimal.name}
                </h3>
                <button
                  onClick={() => setApplyOpen(false)}
                  className="hover:bg-muted text-muted-foreground rounded-lg p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
                {[
                  { label: 'Your full name', placeholder: 'Zhang Wei' },
                  { label: 'Phone number', placeholder: '+86 138 0000 0000' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="mb-1.5 block text-sm font-medium">
                      {f.label}
                    </label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      className="border-border bg-background focus:ring-primary/30 focus:border-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Housing type
                  </label>
                  <div className="flex flex-col gap-2">
                    {['Own house', 'Own apartment', 'Rented apartment'].map(
                      (h) => (
                        <label
                          key={h}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name="housing"
                            className="accent-primary"
                          />
                          {h}
                        </label>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Why do you want to adopt {selectedAnimal.name}?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about yourself and why you'd be a great match..."
                    className="border-border bg-background focus:ring-primary/30 focus:border-primary w-full resize-none rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setApplyOpen(false)}
                  className="border-border text-muted-foreground hover:bg-muted flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setApplyOpen(false)}
                  className="bg-primary flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-8"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        }}
      >
        <h1
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          className="mb-2 text-3xl font-bold text-[#14532d]"
        >
          Find Your Match
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[#166534]">
          Every animal here has survived a rescue journey. They come with full
          medical records, behavioral assessments, and a complete rescue story.
        </p>
        <div className="absolute right-6 bottom-0 text-6xl leading-none opacity-20 select-none">
          🏠
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-card border-border flex gap-1 rounded-xl border p-1 shadow-sm">
          {(['all', 'cat', 'dog'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all'
                ? 'All Animals'
                : f === 'cat'
                  ? '🐱 Cats'
                  : '🐕 Dogs'}
            </button>
          ))}
        </div>
        <span className="text-muted-foreground text-sm">
          {filtered.length} animals available
        </span>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelectedAnimal(a)}
            className="bg-card border-border group cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="bg-muted relative h-52 overflow-hidden">
              <img
                src={a.photo}
                alt={a.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-400 backdrop-blur-sm transition-colors hover:text-red-500">
                <Heart className="h-4 w-4" />
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  Adoptable
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-1 flex items-start justify-between">
                <h3
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  className="text-foreground text-base font-semibold"
                >
                  {a.name}
                </h3>
                <span className="text-lg">
                  {a.animalType === 'cat' ? '🐱' : '🐕'}
                </span>
              </div>
              <p className="text-muted-foreground mb-2 text-xs">
                {a.age} · {a.sex}
              </p>
              <div className="mb-3 flex flex-wrap gap-1">
                {a.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="border-border flex items-center justify-between border-t pt-3">
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {a.waitingDays}d waiting
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  {a.location.split('·')[1]?.trim()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// ─── StoriesPage ──────────────────────────────────────────────
function StoriesPage({ navigate: _navigate }: { navigate: (p: Page) => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          className="text-foreground mb-3 text-4xl font-bold"
        >
          Rescue Stories
        </h1>
        <p className="text-muted-foreground mx-auto max-w-lg text-base leading-relaxed">
          Behind every adopted animal is a chain of strangers who chose to help.
          These are their stories.
        </p>
      </div>

      {/* Featured story */}
      <div
        onClick={() => {}}
        className="border-border group relative mb-8 cursor-pointer overflow-hidden rounded-2xl border shadow-md"
      >
        <div className="grid lg:grid-cols-2">
          <div className="bg-muted relative h-64 overflow-hidden lg:h-auto">
            <img
              src={mockStories[2].photoBefore}
              alt="Before"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
              Before
            </div>
          </div>
          <div className="bg-card flex flex-col justify-center p-8">
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 fill-current text-amber-500" />
              <span className="text-xs font-medium tracking-wide text-amber-600 uppercase">
                Featured Story
              </span>
            </div>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground mb-3 text-2xl leading-tight font-bold"
            >
              {mockStories[2].title}
            </h2>
            <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
              {mockStories[2].excerpt}
            </p>
            <div className="text-muted-foreground flex items-center gap-4 text-xs">
              <span className="text-foreground font-medium">
                {mockStories[2].author}
              </span>
              <span>{mockStories[2].duration} rescue</span>
              <span>{mockStories[2].volunteers} volunteers</span>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                {mockStories[2].likes}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Write your story CTA — first so it's always visible */}
        <div className="bg-card border-primary/30 hover:bg-accent/40 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors">
          <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <Plus className="text-primary h-6 w-6" />
          </div>
          <h3
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-foreground mb-2 font-semibold"
          >
            Share Your Story
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Completed a rescue or adopted an animal? Your story could inspire
            the next rescuer.
          </p>
        </div>
        {mockStories.map((s) => (
          <StoryCard key={s.id} story={s} onClick={() => {}} />
        ))}
      </div>
    </main>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────
function ProfilePage({ navigate }: { navigate: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState<
    'reports' | 'following' | 'achievements'
  >('reports');

  const achievements = [
    {
      icon: '🔰',
      label: 'First Report',
      desc: 'Reported your first stray animal',
      earned: true,
    },
    {
      icon: '🙋',
      label: 'First Rescue',
      desc: 'Claimed and completed your first rescue',
      earned: true,
    },
    {
      icon: '⭐',
      label: 'Rescue Pro',
      desc: 'Completed 10+ rescues',
      earned: false,
    },
    {
      icon: '📝',
      label: 'Storyteller',
      desc: 'Wrote 3+ rescue stories',
      earned: false,
    },
    {
      icon: '💚',
      label: 'Community Hero',
      desc: 'Received 5+ thank-you notes',
      earned: true,
    },
    {
      icon: '🏅',
      label: 'Lifesaver',
      desc: 'Saved an animal marked critical',
      earned: true,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Profile header */}
      <div className="bg-card border-border mb-6 rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-200 to-orange-400 text-3xl">
            🙋
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  className="text-foreground text-xl font-bold"
                >
                  Li Ming
                </h1>
                <p className="text-muted-foreground text-sm">
                  Member since January 2024
                </p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  <Shield className="h-3 w-3" />
                  Volunteer
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  Online
                </span>
              </div>
            </div>
            <div className="text-muted-foreground mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Chaoyang District, Beijing
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-500" />4 achievements
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          { value: '12', label: 'Rescues', icon: '🐾' },
          { value: '3', label: 'Reports', icon: '📍' },
          { value: '1', label: 'Adopted', icon: '🏠' },
          { value: '2', label: 'Stories', icon: '📖' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border-border rounded-xl border p-4 text-center shadow-sm"
          >
            <div className="mb-1 text-xl">{s.icon}</div>
            <div
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-primary mb-1 text-2xl leading-none font-bold"
            >
              {s.value}
            </div>
            <div className="text-muted-foreground text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Volunteer settings strip */}
      <div className="bg-card border-border mb-6 flex items-center justify-between rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Zap className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="text-foreground text-sm font-semibold">
              Volunteer Status
            </div>
            <div className="text-muted-foreground text-xs">
              Radius: 5km · Cats & Dogs
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Online
          </span>
          <button className="text-muted-foreground hover:text-foreground text-xs underline">
            Change
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-border mb-6 flex gap-1 border-b">
        {(['reports', 'following', 'achievements'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-4">
          {mockCases.slice(0, 2).map((c) => (
            <div
              key={c.id}
              className="bg-card border-border flex gap-4 rounded-xl border p-4 shadow-sm"
            >
              <div className="bg-muted h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                <img
                  src={c.photo}
                  alt={c.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between">
                  <h3 className="text-foreground text-sm font-semibold">
                    {c.title}
                  </h3>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  {c.location}
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3" />
                  {c.timeAgo}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'following' && (
        <div className="flex flex-col gap-4">
          {mockCases.slice(1, 3).map((c) => (
            <div
              key={c.id}
              className="bg-card border-border flex cursor-pointer gap-4 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => {}}
            >
              <div className="bg-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                <img
                  src={c.photo}
                  alt={c.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-foreground text-sm font-semibold">
                    {c.title}
                  </h3>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-muted-foreground text-xs">{c.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((a) => (
            <div
              key={a.label}
              className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                a.earned
                  ? 'bg-card border-border shadow-sm'
                  : 'bg-muted/50 border-border/50 opacity-50'
              }`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${a.earned ? 'bg-accent' : 'bg-muted'}`}
              >
                {a.icon}
              </div>
              <div>
                <div className="text-foreground text-sm font-semibold">
                  {a.label}
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {a.desc}
                </div>
                {a.earned && (
                  <div className="text-primary mt-1 text-xs font-medium">
                    Earned ✓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// ─── Knowledge Types ─────────────────────────────────────────
type ArticleCategory =
  | 'emergency'
  | 'feline'
  | 'canine'
  | 'process'
  | 'adoption'
  | 'insights';
type ArticleType = 'professional' | 'community';
type ArticleStatus = 'draft' | 'review' | 'published';
type MedCategory =
  | 'antibiotic'
  | 'antiparasitic'
  | 'vaccine'
  | 'pain'
  | 'supplement'
  | 'emergency-med'
  | 'antifungal';
type MedSpecies = 'cat' | 'dog' | 'both';
type MedRecordStatus = 'active' | 'completed' | 'paused';

interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  type: ArticleType;
  tags: string[];
  excerpt: string;
  content: string[];
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: number;
  views: number;
  likes: number;
  status: ArticleStatus;
}

interface Medication {
  id: string;
  name: string;
  nameEn: string;
  species: MedSpecies;
  category: MedCategory;
  uses: string[];
  dosage: {
    amount: string;
    frequency: string;
    route: string;
    duration: string;
    notes?: string;
  };
  warnings: string[];
  contraindications: string[];
  vetRequired: boolean;
  commonBrands: string[];
}

interface AnimalMedRecord {
  id: string;
  animalName: string;
  caseId: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate: string;
  givenDates: string[];
  prescribedBy: string;
  notes: string;
  status: MedRecordStatus;
}

// ─── Knowledge Mock Data ──────────────────────────────────────
const knowledgeCategories: {
  id: ArticleCategory;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  count: number;
  desc: string;
}[] = [
  {
    id: 'emergency',
    label: 'Emergency',
    emoji: '🚨',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    count: 12,
    desc: 'Injured animals, poisoning, first aid',
  },
  {
    id: 'feline',
    label: 'Feline Rescue',
    emoji: '🐱',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    count: 24,
    desc: 'Kittens, TNR, illness identification',
  },
  {
    id: 'canine',
    label: 'Canine Rescue',
    emoji: '🐕',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    count: 19,
    desc: 'Safety, distemper, large dog handling',
  },
  {
    id: 'process',
    label: 'Rescue Process',
    emoji: '📋',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    count: 8,
    desc: 'Checklists, contacts, legal info',
  },
  {
    id: 'adoption',
    label: 'Adoption & Home',
    emoji: '🏠',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    count: 15,
    desc: 'Screening, first 7 days, multi-pet homes',
  },
  {
    id: 'insights',
    label: 'Veteran Insights',
    emoji: '💡',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    count: 11,
    desc: 'Experience sharing, pitfalls to avoid',
  },
];

const mockArticles: Article[] = [
  {
    id: 'K001',
    title: 'What to Do When You Find an Injured Animal',
    category: 'emergency',
    type: 'professional',
    tags: ['first aid', 'injured', 'emergency'],
    excerpt:
      'Step-by-step guidance for anyone who encounters a hurt stray — before the rescuer arrives.',
    content: [
      'Finding an injured animal is stressful. Your instinct is to help immediately, but the wrong moves can cause more harm. This guide gives you a clear, calm sequence to follow.',
      "Step 1 — Assess from a distance first. Don't rush in. Observe: Is the animal conscious? Breathing? Can it move? Is it in immediate danger (road, moving cars)? A frightened, injured animal may bite even if it's normally friendly.",
      "Step 2 — If the animal is in a dangerous location (road, busy intersection), prioritize moving it to safety. Use a jacket, towel, or box as a stretcher. Support the spine if a spinal injury is possible — don't let the animal's body bend.",
      'Step 3 — Control bleeding with direct pressure. Use a clean cloth. Do not remove the cloth — add more on top if it soaks through. Tourniquets are rarely appropriate and can cause permanent damage if misapplied.',
      'Step 4 — Keep the animal warm and minimize stimulation. A shoebox or bag lined with a towel works well. Darkness and quiet reduce shock. Do not offer food or water — an animal may need surgery.',
      'Step 5 — Report on PawHaven immediately with photos and location. A trained volunteer will be notified. If no volunteer is nearby within 30 minutes, contact the nearest veterinary clinic directly.',
      'Important: Never give human medication to an animal. Ibuprofen and paracetamol are toxic to cats and dogs. When in doubt, do nothing and wait for a trained rescuer.',
    ],
    author: 'Dr. Li Xiaoran',
    authorRole: 'Senior Veterinarian, Beijing Animal Hospital',
    publishedAt: '2025-05-12',
    readTime: 6,
    views: 4821,
    likes: 312,
    status: 'published',
  },
  {
    id: 'K002',
    title: 'Complete Newborn Kitten Rescue Guide',
    category: 'feline',
    type: 'professional',
    tags: ['kitten', 'newborn', 'bottle-feeding'],
    excerpt:
      'Neonatal kittens under 4 weeks old cannot survive without intervention. This guide covers feeding, warmth, stimulation, and the critical first 72 hours.',
    content: [
      "Newborn kittens (eyes still closed, under 2 weeks old) are among the most vulnerable animals you'll encounter. They cannot regulate their own body temperature and will die within hours from hypothermia if not kept warm.",
      'Immediate priorities: Warmth first, food second. A kitten that is cold cannot digest food. Wrap it in a soft towel and hold it against your body, or place it on a heating pad set to LOW with a thick cloth barrier. Never place kittens directly on a heat source.',
      "Feeding schedule: Under 1 week — every 2 hours including overnight. 1–2 weeks — every 3 hours. 2–4 weeks — every 4 hours. Use kitten milk replacer (KMR) — never cow's milk, which causes diarrhea and dehydration.",
      'Stimulation: Kittens cannot urinate or defecate on their own until approximately 3 weeks of age. After each feeding, gently stimulate the genital area with a warm, damp cotton ball. Failure to do this causes fatal bloating.',
      'Eyes open at approximately 10–14 days. Ears open at approximately 14 days. Any discharge from eyes or a whistling/gurgling sound when breathing requires immediate veterinary attention.',
      'When to seek emergency vet care: Not feeding after 2 attempts, persistent crying, pale gums, cold despite warming, bloated abdomen, or visible injury.',
    ],
    author: 'Wang Jing',
    authorRole: 'Certified Animal Rescue Specialist, 8 years experience',
    publishedAt: '2025-04-20',
    readTime: 9,
    views: 7203,
    likes: 541,
    status: 'published',
  },
  {
    id: 'K003',
    title: 'First Aid for Animals Hit by Vehicles',
    category: 'emergency',
    type: 'professional',
    tags: ['car accident', 'trauma', 'transport'],
    excerpt:
      'Vehicle trauma requires a specific response sequence. Getting it wrong can paralyze an animal that might have fully recovered.',
    content: [
      'Vehicle trauma is one of the most common severe injury types in urban rescue. The most dangerous mistake is moving the animal incorrectly — internal injuries and spinal damage can be worsened by improper handling.',
      'Assess the scene first. Ensure your own safety. Turn on hazard lights if possible. Never put yourself between traffic and the animal.',
      'Signs of serious internal injury: pale or white gums (blood loss), rapid shallow breathing, distended abdomen, blood from any orifice, inability to stand. These animals need emergency veterinary care within the hour.',
      'How to move safely: Use a rigid surface if possible — a piece of cardboard, a cutting board, or a car floor mat. Slide the animal onto it rather than lifting. Keep the head, spine, and pelvis aligned. Two people is strongly preferable.',
      'If you must lift alone: Support the hindquarters and thorax simultaneously. Never pick up by the legs or tail. Keep the spine straight throughout.',
      'Keep the animal in a quiet, darkened box during transport. Fast driving causes stress and can worsen shock. Call ahead to the veterinary clinic so they are prepared.',
    ],
    author: 'Dr. Chen Weihao',
    authorRole: 'Emergency Veterinarian, 5 years in trauma care',
    publishedAt: '2025-06-01',
    readTime: 7,
    views: 3140,
    likes: 228,
    status: 'published',
  },
  {
    id: 'K004',
    title: 'Stray Dog Rescue Safety Guide',
    category: 'canine',
    type: 'community',
    tags: ['dog', 'safety', 'approach'],
    excerpt:
      'How to approach a fearful or potentially aggressive stray dog without getting bitten — practical field techniques from 6 years of dog rescue.',
    content: [
      'Dogs bite most often from fear, not aggression. Understanding this changes everything about how you approach a stray.',
      "Read the body language first. Tail tucked, ears flat, crouching — fear. Showing teeth, stiff posture, direct eye contact — warning. Either way, do not approach directly. Give the dog an exit route and don't block it.",
      'Never crouch and stare directly at an unfamiliar dog. Turn sideways, look slightly away, and let the dog approach you on its terms. Throw treats in a wide arc so the dog can eat them while staying at a safe distance.',
      "Avoid sudden movements, loud voices, and direct reach. Move slowly and predictably. If the dog takes a treat from your hand, that's a major trust indicator — try to attach a lead loosely, not grab the collar.",
      "For a dog that won't approach at all: a humane trap baited with smelly food (canned tuna, rotisserie chicken) is far safer than chasing. Most dogs can be trapped within 24 hours.",
      'If bitten: wash the wound thoroughly with soap and water for 15 minutes, then seek medical attention. Report the bite to local authorities. The animal should be monitored for rabies if unvaccinated.',
    ],
    author: 'Liu Mingzhi',
    authorRole: 'Volunteer Rescuer, 6 years, 80+ dog rescues',
    publishedAt: '2025-03-15',
    readTime: 8,
    views: 2891,
    likes: 195,
    status: 'published',
  },
  {
    id: 'K005',
    title: 'Your First Rescue: A Complete Checklist',
    category: 'process',
    type: 'community',
    tags: ['checklist', 'beginner', 'volunteer'],
    excerpt:
      'Everything a first-time volunteer should know before, during, and after their first rescue — from supplies to paperwork.',
    content: [
      'Your first rescue will feel chaotic. Having a checklist in your pocket (or bookmarked on your phone) will help you stay calm and not miss anything critical.',
      "Before you go: Confirm the case location on the map. Read the reporter's notes carefully — especially the animal's behavior (friendly/wary/aggressive). Pack your rescue kit: carrier or box, thick gloves, old towel, treats, water, and a portable first aid kit.",
      "On site: Take photos first. Document the animal's condition before you intervene — this protects you and provides a baseline for veterinary care. Update the PawHaven case with your arrival.",
      'Capturing the animal: Never corner a frightened animal against a wall with no exit — it will fight. Use the environment to guide it into a carrier. Patience is faster than force. A catch pole or humane trap is worth carrying for aggressive animals.',
      "After capture: Keep the animal calm and warm during transport. Do not let it see or smell other animals. Cover the carrier with a cloth. Go directly to the pre-arranged veterinary clinic or shelter — don't make stops.",
      'Case update: Post a status update on PawHaven within 1 hour. The reporter is waiting anxiously. A photo of the animal safely in a carrier goes a long way.',
    ],
    author: 'Sun Hui',
    authorRole: 'Rescue Coordinator, Happy Paws Shelter',
    publishedAt: '2025-02-28',
    readTime: 5,
    views: 5620,
    likes: 403,
    status: 'published',
  },
  {
    id: 'K006',
    title: 'New Pet at Home: The Critical First 7 Days',
    category: 'adoption',
    type: 'professional',
    tags: ['adoption', 'new home', 'adjustment'],
    excerpt:
      'The first week sets the foundation for a lifetime bond — or a return. Evidence-based guidance for a smooth transition.',
    content: [
      'The 3-3-3 rule of adoption: 3 days to decompress, 3 weeks to learn the routine, 3 months to feel truly at home. Most adoption failures happen in the first 3 days because new owners misinterpret normal decompression behavior as a personality problem.',
      "Day 1–3 (Decompression): Give the animal one small, quiet room of its own. Don't force interaction. Let it explore at its own pace. Resist the urge to invite friends over or introduce other pets. Food, water, and a litter box (for cats) should all be accessible in this safe room.",
      'Signs of healthy decompression: Hiding (normal — not cause for alarm), eating little, sleeping a lot, not playing, staying still. These should improve gradually. Signs that need attention: not eating or drinking for more than 48 hours, labored breathing, or visible injury.',
      'Day 4–7 (First exploration): Begin short, supervised exploration of the rest of the home. For cats, this means leaving the safe room door open and letting them investigate. For dogs, supervised house access with their existing outdoor routine maintained.',
      'Introducing to existing pets: Never a direct face-to-face meeting in the first week. Use scent exchange first (swap bedding), then parallel exposure through a baby gate or door crack. Rushing this is the most common mistake.',
      'Veterinary visit: Within the first week, ideally within 48 hours. Bring all medical records provided by the shelter. This visit establishes a baseline and ensures any conditions picked up in the shelter environment are treated early.',
    ],
    author: 'Dr. Zhang Fang',
    authorRole: 'Veterinary Behaviorist',
    publishedAt: '2025-05-30',
    readTime: 10,
    views: 6102,
    likes: 489,
    status: 'published',
  },
  {
    id: 'K007',
    title: '5 Mistakes I Made on My First Cat Rescue',
    category: 'insights',
    type: 'community',
    tags: ['experience', 'mistakes', 'lessons'],
    excerpt:
      "Honest account of what went wrong — and what I'd do differently. Written for everyone who has ever rushed in with good intentions.",
    content: [
      "I've been rescuing cats for four years. My first rescue was a disaster. The cat was fine — but only because I was lucky, not because I did anything right. Here's what I learned the hard way.",
      'Mistake 1: I grabbed the cat. I saw an injured cat under a car and just reached in and grabbed it. It bit me deeply on the hand. I needed a tetanus shot. I terrified the cat and it took another 2 hours to re-approach it. Lesson: Always use thick gloves. Always approach slowly. A trap takes longer but is dramatically safer for both of you.',
      "Mistake 2: I didn't update the case. The person who reported the case was sitting at home refreshing the app, terrified. I was so focused on the cat that I forgot to post a single update for 4 hours. Lesson: A 30-second update photo matters enormously to the person who cared enough to report.",
      'Mistake 3: I went alone. A second person is invaluable — one to manage the animal, one to manage doors, carriers, traffic. Going alone is possible but significantly harder and more dangerous for both you and the animal.',
      "Mistake 4: I didn't have a vet lined up. At 11pm on a Friday I was driving around with an injured cat in my car trying to find any open vet. Lesson: Save the numbers of 2–3 vets who take emergency cases, and know which shelters have overnight staff.",
      "Mistake 5: I didn't look after myself afterward. The first case that doesn't go well — and some won't — can be emotionally devastating. Find other volunteers to talk to. The PawHaven community is here for exactly this.",
    ],
    author: 'Anonymous Volunteer',
    authorRole: '4-year rescue volunteer, 40+ rescues',
    publishedAt: '2025-01-10',
    readTime: 7,
    views: 9340,
    likes: 712,
    status: 'published',
  },
  {
    id: 'K008',
    title: 'Identifying and Handling Feline Parvovirus (Panleukopenia)',
    category: 'feline',
    type: 'professional',
    tags: ['panleukopenia', 'disease', 'isolation'],
    excerpt:
      'Feline panleukopenia kills quickly and spreads silently. This guide helps rescuers identify it early and prevent shelter outbreaks.',
    content: [
      'Feline panleukopenia (also called feline distemper or cat plague) is one of the deadliest cat diseases encountered in rescue. Mortality rate in unvaccinated kittens approaches 90%. It spreads via feces, vomit, and contaminated surfaces — and the virus survives in the environment for months.',
      'Key warning signs: sudden onset vomiting, profuse watery diarrhea (often bloody), high fever followed by subnormal temperature, complete loss of appetite, severe lethargy, and a hunched posture with the head pressed to the ground.',
      'Kittens under 5 months are at highest risk. Vaccinated adults rarely die from panleukopenia but can still spread it.',
      'If you suspect panleukopenia: Isolate the animal immediately. Do not bring it into a shelter or foster home with other cats. Contact a veterinarian for a rapid antigen test (results in 10 minutes). Wear gloves and change clothes before handling other animals.',
      'Decontamination: Household bleach diluted 1:32 in water is the only reliably effective disinfectant. Most hand sanitizers and quaternary ammonium disinfectants are NOT effective against parvo.',
      'Prevention: Vaccination (FVRCP, typically given at 6–8 weeks and boosted at 10–12 weeks) is highly effective. Any unvaccinated cat entering a rescue situation should be considered at risk.',
    ],
    author: 'Dr. Li Xiaoran',
    authorRole: 'Senior Veterinarian, Beijing Animal Hospital',
    publishedAt: '2025-06-18',
    readTime: 8,
    views: 2103,
    likes: 167,
    status: 'published',
  },
  {
    id: 'K009',
    title: 'Draft: Rescue Supply Kit — What You Actually Need',
    category: 'process',
    type: 'community',
    tags: ['supplies', 'equipment', 'preparation'],
    excerpt:
      "A realistic, field-tested kit list — not the aspirational list that costs ¥3,000. What's actually essential vs. nice-to-have.",
    content: ['Draft content in progress.'],
    author: 'You (Li Ming)',
    authorRole: 'Volunteer',
    publishedAt: '',
    readTime: 4,
    views: 0,
    likes: 0,
    status: 'draft',
  },
  {
    id: 'K010',
    title: 'Introducing a TNR Program to Your Neighborhood',
    category: 'feline',
    type: 'community',
    tags: ['TNR', 'community cats', 'sterilization'],
    excerpt:
      'A practical guide to starting a Trap-Neuter-Return program — working with neighbors, vets, and local government.',
    content: ['Under review by Dr. Li Xiaoran.'],
    author: 'Chen Xiaomei',
    authorRole: 'Volunteer',
    publishedAt: '',
    readTime: 12,
    views: 0,
    likes: 0,
    status: 'review',
  },
];

const mockMedications: Medication[] = [
  {
    id: 'M001',
    name: '阿莫西林克拉维酸钾',
    nameEn: 'Amoxicillin-Clavulanate',
    species: 'both',
    category: 'antibiotic',
    uses: [
      'Skin and wound infections',
      'Respiratory infections',
      'Urinary tract infections',
      'Bite wound prophylaxis',
    ],
    dosage: {
      amount: '12.5–25 mg/kg',
      frequency: 'Every 12 hours',
      route: 'Oral',
      duration: '7–14 days',
      notes: 'Give with food to reduce GI upset. Complete the full course.',
    },
    warnings: [
      'Monitor for vomiting and diarrhea',
      'May cause allergic reactions — watch for facial swelling, hives',
      'Prolonged use may cause yeast overgrowth',
    ],
    contraindications: [
      'Known penicillin allergy',
      'Severe hepatic impairment',
    ],
    vetRequired: true,
    commonBrands: ['Synulox', 'Augmentin (veterinary formulation)'],
  },
  {
    id: 'M002',
    name: '多西环素',
    nameEn: 'Doxycycline',
    species: 'both',
    category: 'antibiotic',
    uses: [
      'Respiratory infections (especially Mycoplasma)',
      'Tick-borne diseases',
      'Chlamydophila (cats)',
      'Leptospirosis',
    ],
    dosage: {
      amount: '5–10 mg/kg',
      frequency: 'Every 12–24 hours',
      route: 'Oral',
      duration: '10–21 days',
      notes:
        'Always follow with water or food — esophageal stricture reported in cats given tablets dry.',
    },
    warnings: [
      'CRITICAL in cats: Must be followed immediately by 5–6 mL water or food to prevent esophageal damage',
      'Photosensitivity possible',
      'May cause nausea',
    ],
    contraindications: [
      'Pregnancy and nursing',
      'Young animals under 6 months (tooth staining)',
    ],
    vetRequired: true,
    commonBrands: ['Vibramycin', 'Doxyvet'],
  },
  {
    id: 'M003',
    name: '甲硝唑',
    nameEn: 'Metronidazole',
    species: 'both',
    category: 'antibiotic',
    uses: [
      'Giardia',
      'Inflammatory bowel disease',
      'Anaerobic bacterial infections',
      'Diarrhea with bacterial component',
    ],
    dosage: {
      amount: 'Cats: 10–25 mg/kg / Dogs: 15–25 mg/kg',
      frequency: 'Every 12–24 hours',
      route: 'Oral',
      duration: '5–7 days',
    },
    warnings: [
      'Neurological side effects at high doses (ataxia, tremors, seizures)',
      'Bitter taste — many cats refuse tablets; use compounded liquid',
      'Short-term use only',
    ],
    contraindications: [
      'History of neurological disease',
      'First trimester pregnancy',
    ],
    vetRequired: false,
    commonBrands: ['Flagyl', 'Metronidazole 250mg tablets'],
  },
  {
    id: 'M004',
    name: '伊维菌素',
    nameEn: 'Ivermectin',
    species: 'dog',
    category: 'antiparasitic',
    uses: [
      'Mange (sarcoptic and demodectic)',
      'Ear mites',
      'Heartworm prevention (low dose)',
      'Internal parasites',
    ],
    dosage: {
      amount: '0.2–0.4 mg/kg (mange) / 0.006 mg/kg (heartworm prevention)',
      frequency: 'Weekly (mange) / Monthly (prevention)',
      route: 'Subcutaneous injection or oral',
      duration: '4–8 weeks for mange',
    },
    warnings: [
      'NEVER use in Collies, Shelties, Australian Shepherds, or MDR1/ABCB1 mutation carriers — can be fatal',
      'Use with extreme caution in debilitated animals',
      'Not for cats at mange doses',
    ],
    contraindications: [
      'MDR1/ABCB1 gene mutation (common in herding breeds)',
      'Cats at high doses',
      'Puppies under 6 weeks',
    ],
    vetRequired: true,
    commonBrands: ['Ivomec', 'Mectizan'],
  },
  {
    id: 'M005',
    name: '赛拉菌素 (大宠爱)',
    nameEn: 'Selamectin (Revolution)',
    species: 'both',
    category: 'antiparasitic',
    uses: [
      'Fleas and flea eggs',
      'Heartworm prevention',
      'Ear mites',
      'Sarcoptic mange',
      'Certain ticks',
    ],
    dosage: {
      amount: 'Cats: 6 mg/kg / Dogs: 6–12 mg/kg',
      frequency: 'Once monthly',
      route: 'Topical (spot-on)',
      duration: 'Ongoing monthly application',
    },
    warnings: [
      'Apply to skin, not fur — part fur at base of neck',
      'Keep dry for 2 hours after application',
      'Mild hair loss at application site possible',
    ],
    contraindications: [
      'Sick, debilitated, or underweight animals — consult vet first',
      'Under 6 weeks of age',
    ],
    vetRequired: false,
    commonBrands: ['Revolution', 'Stronghold'],
  },
  {
    id: 'M006',
    name: '狂犬病疫苗',
    nameEn: 'Rabies Vaccine',
    species: 'both',
    category: 'vaccine',
    uses: [
      'Prevention of rabies (legally required in most regions)',
      'Post-exposure prophylaxis (as part of protocol)',
    ],
    dosage: {
      amount: '1 dose (1 mL)',
      frequency:
        'Primary: 3 months. Booster: annually or every 3 years depending on vaccine',
      route: 'Subcutaneous or intramuscular injection',
      duration: '1 year (annual) or 3 years (triennial)',
    },
    warnings: [
      'Vaccine reactions possible (lethargy, mild fever for 24–48 hours)',
      'Anaphylaxis rare but keep epinephrine available for 30 min post-vaccination',
    ],
    contraindications: [
      'Fever or acute illness — delay vaccination',
      'Severely immunocompromised animals — consult specialist',
    ],
    vetRequired: true,
    commonBrands: ['Nobivac Rabies', 'IMRAB', 'Canigen R'],
  },
  {
    id: 'M007',
    name: '猫三联疫苗 (FVRCP)',
    nameEn: 'FVRCP Cat Combination Vaccine',
    species: 'cat',
    category: 'vaccine',
    uses: [
      'Prevention of feline rhinotracheitis (herpesvirus)',
      'Prevention of calicivirus',
      'Prevention of panleukopenia (feline distemper)',
    ],
    dosage: {
      amount: '1 dose (1 mL)',
      frequency:
        'Primary: 6–8 weeks, 10–12 weeks, 14–16 weeks. Booster: 1 year. Adult: every 1–3 years',
      route: 'Subcutaneous injection',
      duration: 'Per schedule',
    },
    warnings: [
      'Mild lethargy and soreness for 1–2 days expected',
      'Live attenuated vaccines should not be given to pregnant cats',
    ],
    contraindications: [
      'Sick or febrile animals',
      'Pregnancy (for modified live vaccines)',
    ],
    vetRequired: true,
    commonBrands: ['Nobivac Tricat', 'Felocell CVR', 'Purevax RCP'],
  },
  {
    id: 'M008',
    name: '美洛昔康',
    nameEn: 'Meloxicam',
    species: 'both',
    category: 'pain',
    uses: [
      'Post-surgical pain',
      'Musculoskeletal pain',
      'Fever reduction',
      'Short-term pain management',
    ],
    dosage: {
      amount:
        'Cats: 0.1 mg/kg (initial), 0.05 mg/kg (maintenance) / Dogs: 0.1–0.2 mg/kg',
      frequency: 'Once daily',
      route: 'Oral liquid or injection',
      duration: 'Short-term: 3–5 days. Chronic use requires monitoring.',
    },
    warnings: [
      'CRITICAL: Cats are extremely sensitive — do NOT exceed dose',
      'Monitor kidney function with long-term use',
      'Give with food',
      'Never combine with other NSAIDs or corticosteroids',
    ],
    contraindications: [
      'Renal or hepatic impairment',
      'Dehydrated or hypovolemic animals',
      'Gastrointestinal ulcers',
      'Concurrent NSAID or corticosteroid use',
    ],
    vetRequired: true,
    commonBrands: ['Metacam', 'Loxicom'],
  },
  {
    id: 'M009',
    name: '赖氨酸',
    nameEn: 'L-Lysine',
    species: 'cat',
    category: 'supplement',
    uses: [
      'Herpesvirus (FHV-1) symptom management',
      'Upper respiratory infection support',
      'Sneezing and eye discharge from chronic herpes',
    ],
    dosage: {
      amount: '250–500 mg per cat',
      frequency: 'Twice daily',
      route: 'Oral (mixed in food or paste)',
      duration: 'Ongoing or during flare-ups',
    },
    warnings: [
      'Efficacy for herpes is debated in recent literature — benefits may be limited',
      'Generally very safe',
      'Do not exceed 500 mg/day in kittens under 6 months',
    ],
    contraindications: ['None established at standard doses'],
    vetRequired: false,
    commonBrands: ['Vetri-Lysine Plus', 'Enisyl-F', 'Viralys'],
  },
  {
    id: 'M010',
    name: '肾上腺素',
    nameEn: 'Epinephrine (Adrenaline)',
    species: 'both',
    category: 'emergency-med',
    uses: [
      'Anaphylactic shock (vaccine reactions, bee stings)',
      'Cardiac arrest (CPR adjunct)',
      'Severe allergic reactions',
    ],
    dosage: {
      amount: '0.01 mg/kg (1:1000 solution)',
      frequency: 'Once, may repeat every 5 minutes',
      route: 'Intramuscular (preferred) or intravenous',
      duration: 'Emergency use only',
    },
    warnings: [
      'Emergency use only — must be administered by a veterinarian',
      'Can cause cardiac arrhythmias at high doses',
      'Store at room temperature, protect from light',
    ],
    contraindications: [
      'Cardiac arrhythmias (relative)',
      'Hyperthyroidism (relative)',
    ],
    vetRequired: true,
    commonBrands: ['Adrenalin injection 1mg/mL'],
  },
];

const mockMedRecords: AnimalMedRecord[] = [
  {
    id: 'R001',
    animalName: 'Snowflake (White Cat)',
    caseId: 'PAW-0421',
    medicationId: 'M001',
    medicationName: '阿莫西林克拉维酸钾 (Amoxicillin-Clavulanate)',
    dose: '62.5 mg',
    frequency: 'Every 12 hours',
    startDate: '2025-07-01',
    endDate: '2025-07-14',
    givenDates: ['2025-07-01', '2025-07-02', '2025-07-02', '2025-07-03'],
    prescribedBy: 'Dr. Li Xiaoran — Love Pet Clinic',
    notes: 'For wound infection prevention post-rescue. Give with food.',
    status: 'active',
  },
  {
    id: 'R002',
    animalName: 'Snowflake (White Cat)',
    caseId: 'PAW-0421',
    medicationId: 'M008',
    medicationName: '美洛昔康 (Meloxicam)',
    dose: '0.3 mg (0.1 mg/kg based on 3.0 kg body weight)',
    frequency: 'Once daily',
    startDate: '2025-07-01',
    endDate: '2025-07-04',
    givenDates: ['2025-07-01', '2025-07-02', '2025-07-03', '2025-07-04'],
    prescribedBy: 'Dr. Li Xiaoran — Love Pet Clinic',
    notes:
      'Post-trauma pain management. 3-day course. Given with food, monitor for appetite loss.',
    status: 'completed',
  },
  {
    id: 'R003',
    animalName: 'Senior Golden',
    caseId: 'PAW-0409',
    medicationId: 'M002',
    medicationName: '多西环素 (Doxycycline)',
    dose: '100 mg',
    frequency: 'Every 12 hours',
    startDate: '2025-06-29',
    endDate: '2025-07-13',
    givenDates: [
      '2025-06-29',
      '2025-06-29',
      '2025-06-30',
      '2025-06-30',
      '2025-07-01',
      '2025-07-01',
    ],
    prescribedBy: 'Beijing Veterinary Hospital',
    notes:
      'Possible tick-borne infection. IMPORTANT: Follow each dose immediately with 5–6 mL water. Give with food.',
    status: 'active',
  },
];

// ─── Category + Article Helpers ───────────────────────────────
const catMeta = (id: ArticleCategory) =>
  knowledgeCategories.find((c) => c.id === id)!;

const medCategoryMeta: Record<
  MedCategory,
  { label: string; color: string; bg: string }
> = {
  antibiotic: { label: 'Antibiotic', color: 'text-blue-700', bg: 'bg-blue-50' },
  antiparasitic: {
    label: 'Antiparasitic',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
  },
  vaccine: { label: 'Vaccine', color: 'text-green-700', bg: 'bg-green-50' },
  pain: { label: 'Pain / NSAID', color: 'text-orange-700', bg: 'bg-orange-50' },
  supplement: { label: 'Supplement', color: 'text-teal-700', bg: 'bg-teal-50' },
  'emergency-med': {
    label: 'Emergency',
    color: 'text-red-700',
    bg: 'bg-red-50',
  },
  antifungal: {
    label: 'Antifungal',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
  },
};

// ─── KnowledgePage ───────────────────────────────────────────
function KnowledgePage({ navigate: _nav }: { navigate: (p: Page) => void }) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<ArticleCategory | 'all'>('all');
  const [filterType, setFilterType] = useState<ArticleType | 'all'>('all');
  const [helpful, setHelpful] = useState<'yes' | 'no' | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const published = mockArticles.filter((a) => a.status === 'published');
  const filtered = published.filter((a) => {
    const q = query.toLowerCase();
    return (
      (!query ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q))) &&
      (filterCat === 'all' || a.category === filterCat) &&
      (filterType === 'all' || a.type === filterType)
    );
  });

  // ── Article detail view ──
  if (selectedArticle) {
    const a = selectedArticle;
    const cat = catMeta(a.category);
    const related = mockArticles
      .filter(
        (r) =>
          r.id !== a.id &&
          r.category === a.category &&
          r.status === 'published',
      )
      .slice(0, 2);
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          onClick={() => {
            setSelectedArticle(null);
            setHelpful(null);
            setBookmarked(false);
          }}
          className="text-muted-foreground hover:text-foreground group mb-6 flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />{' '}
          Back to Knowledge Base
        </button>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${cat.bg} ${cat.color}`}
                >
                  {cat.emoji} {cat.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.type === 'professional' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {a.type === 'professional'
                    ? '🏥 Professionally Reviewed'
                    : '💬 Community Experience'}
                </span>
              </div>
              <h1
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                className="text-foreground mb-3 text-2xl leading-tight font-bold"
              >
                {a.title}
              </h1>
              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                {a.excerpt}
              </p>
              <div className="text-muted-foreground border-border flex flex-wrap items-center gap-4 border-t pt-4 text-xs">
                <span>
                  <span className="text-foreground font-semibold">
                    {a.author}
                  </span>{' '}
                  · {a.authorRole}
                </span>
                <span>{a.publishedAt}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {a.readTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {a.views.toLocaleString()}
                </span>
              </div>
            </div>
            {a.type === 'professional' && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <Stethoscope className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Professionally Reviewed.</strong> For reference only.
                  Always consult a qualified veterinarian before treatment.
                </span>
              </div>
            )}
            <div className="bg-card border-border flex flex-col gap-5 rounded-2xl border p-6 shadow-sm">
              {a.content.map((para, i) => (
                <p
                  key={i}
                  className={`text-foreground text-sm leading-relaxed ${i === 0 ? 'text-base font-medium' : ''}`}
                >
                  {para}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {a.tags.map((t) => (
                <span
                  key={t}
                  className="bg-muted text-muted-foreground flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                >
                  <Tag className="h-3 w-3" /> {t}
                </span>
              ))}
            </div>
            <div className="bg-card border-border rounded-2xl border p-5 text-center shadow-sm">
              <p className="text-foreground mb-3 text-sm font-medium">
                Was this article helpful?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setHelpful('yes')}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors ${helpful === 'yes' ? 'border-green-300 bg-green-100 text-green-700' : 'border-border hover:bg-muted'}`}
                >
                  <ThumbsUp className="h-4 w-4" /> Yes (
                  {a.likes + (helpful === 'yes' ? 1 : 0)})
                </button>
                <button
                  onClick={() => setHelpful('no')}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors ${helpful === 'no' ? 'border-red-200 bg-red-50 text-red-700' : 'border-border hover:bg-muted'}`}
                >
                  <X className="h-4 w-4" /> Needs improvement
                </button>
              </div>
              {helpful && (
                <p className="text-muted-foreground mt-3 text-xs">
                  {helpful === 'yes'
                    ? 'Thank you for your feedback!'
                    : "We'll review and improve this article."}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${bookmarked ? 'bg-accent text-primary border-primary/20' : 'border-border hover:bg-muted'}`}
              >
                <Bookmark
                  className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`}
                />{' '}
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
            <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                About the Author
              </p>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-lg">
                  {a.type === 'professional' ? '🩺' : '🙋'}
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    {a.author}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    {a.authorRole}
                  </p>
                </div>
              </div>
            </div>
            {related.length > 0 && (
              <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                  Related Articles
                </p>
                <div className="flex flex-col gap-2">
                  {related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedArticle(r);
                        setHelpful(null);
                      }}
                      className="bg-muted hover:bg-accent rounded-xl p-3 text-left transition-colors"
                    >
                      <p className="text-foreground text-xs leading-snug font-medium">
                        {r.title}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {r.readTime} min · {r.views.toLocaleString()} views
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Browse view (default) ──
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-8"
        style={{
          background:
            'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
        }}
      >
        <div className="absolute right-6 bottom-0 text-7xl leading-none opacity-15 select-none">
          📚
        </div>
        <h1
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          className="mb-2 text-3xl font-bold text-[#78350f]"
        >
          Rescue Knowledge Base
        </h1>
        <p className="mb-5 max-w-lg text-sm leading-relaxed text-[#92400e]">
          Professional knowledge shouldn't stay locked in experienced rescuers'
          heads. Every article is reviewed by veterinarians or certified rescue
          specialists.
        </p>
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#92400e]/60" />
          <input
            type="text"
            placeholder="Search articles, guides, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[#f6d860] bg-white/80 py-2.5 pr-4 pl-10 text-sm shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 focus:outline-none"
          />
        </div>
      </div>

      {!query && filterCat === 'all' && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {knowledgeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${cat.bg}`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className={`text-xs font-semibold ${cat.color}`}>
                {cat.label}
              </span>
              <span className="text-muted-foreground text-xs">
                {cat.count} articles
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filterCat !== 'all' && (
          <button
            onClick={() => setFilterCat('all')}
            className="bg-primary flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white"
          >
            {catMeta(filterCat).emoji} {catMeta(filterCat).label}{' '}
            <X className="h-3 w-3" />
          </button>
        )}
        <div className="bg-card border-border flex gap-1 rounded-xl border p-1">
          {(
            [
              ['all', 'All types'],
              ['professional', '🏥 Professional'],
              ['community', '💬 Community'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterType(v as ArticleType | 'all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filterType === v ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-muted-foreground ml-auto text-sm">
          {filtered.length} articles
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">
            No articles found{query ? ` for "${query}"` : ''}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const cat = catMeta(a.category);
            return (
              <div
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className="bg-card border-border group flex cursor-pointer flex-col rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`border-border flex items-center justify-between rounded-t-2xl border-b px-4 py-3 ${cat.bg}`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold ${cat.color}`}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.type === 'professional' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {a.type === 'professional' ? '🏥 Pro' : '💬 Community'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    className="text-foreground group-hover:text-primary mb-2 text-base leading-snug font-semibold transition-colors"
                  >
                    {a.title}
                  </h3>
                  <p className="text-muted-foreground mb-3 line-clamp-2 flex-1 text-sm leading-relaxed">
                    {a.excerpt}
                  </p>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {a.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="border-border text-muted-foreground flex items-center justify-between border-t pt-3 text-xs">
                    <span className="text-foreground max-w-[120px] truncate font-medium">
                      {a.author.split(',')[0]}
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {a.readTime}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {a.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AuthModal ───────────────────────────────────────────────
function AuthModal({
  mode,
  onClose,
  onSuccess,
}: {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState<'signin' | 'signup'>(mode);
  const [done, setDone] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    setDone(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-sm text-white">🐾</span>
            </div>
            <span
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground text-lg font-bold"
            >
              PawHaven
            </span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-muted text-muted-foreground rounded-lg p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-muted mx-6 mb-5 flex rounded-xl p-1">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${tab === 'signin' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${tab === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Create Account
          </button>
        </div>

        {done ? (
          <div className="px-6 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-foreground mb-1 text-xl font-bold"
            >
              {tab === 'signup' ? 'Welcome to PawHaven!' : 'Welcome back!'}
            </h3>
            <p className="text-muted-foreground text-sm">Signing you in…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-6 pb-6">
            {/* Social login */}
            <div className="flex flex-col gap-2">
              <button className="border-border bg-card hover:bg-muted text-foreground flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
              <button className="border-border bg-card hover:bg-muted text-foreground flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors">
                <MessageCircle className="h-4 w-4 text-green-600" />
                Continue with WeChat
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-border h-px flex-1" />
              <span className="text-muted-foreground text-xs">or</span>
              <div className="bg-border h-px flex-1" />
            </div>

            {/* Form fields */}
            {tab === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Li Ming"
                  className="border-border bg-background focus:ring-primary/30 focus:border-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="border-border bg-background focus:ring-primary/30 focus:border-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
                {tab === 'signin' && (
                  <button className="text-primary text-xs hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border-border bg-background focus:ring-primary/30 focus:border-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            {tab === 'signup' && (
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="accent-primary mt-0.5"
                />
                <span className="text-muted-foreground text-xs leading-relaxed">
                  I agree to PawHaven's{' '}
                  <span className="text-primary cursor-pointer hover:underline">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-primary cursor-pointer hover:underline">
                    Privacy Policy
                  </span>
                  . I understand my data helps connect rescue animals with
                  helpers.
                </span>
              </label>
            )}

            <button
              onClick={handleSubmit}
              disabled={tab === 'signup' && !agreed}
              className="bg-primary text-primary-foreground w-full rounded-xl py-3 text-sm font-semibold shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <p className="text-muted-foreground text-center text-xs">
              {tab === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setTab('signup')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Join free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setTab('signin')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SiteFooter ───────────────────────────────────────────────
function SiteFooter({ navigate }: { navigate: (p: Page) => void }) {
  const footerLinks: {
    heading: string;
    links: { label: string; page?: Page }[];
  }[] = [
    {
      heading: 'Platform',
      links: [
        { label: 'Browse Rescues', page: 'home' },
        { label: 'Report a Stray', page: 'report' },
        { label: 'Adopt an Animal', page: 'adopt' },
        { label: 'Volunteer', page: 'profile' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Knowledge Base', page: 'knowledge' },
        { label: 'Medication Library', page: 'knowledge' },
        { label: 'Rescue Stories', page: 'stories' },
        { label: 'Emergency Guide', page: 'knowledge' },
      ],
    },
    {
      heading: 'Community',
      links: [
        { label: 'Volunteer Network', page: 'profile' },
        { label: 'Partner Shelters' },
        { label: 'Vet Directory' },
        { label: 'Share a Story', page: 'stories' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About PawHaven' },
        { label: 'Open Source' },
        { label: 'Privacy Policy' },
        { label: 'Terms of Service' },
      ],
    },
  ];

  return (
    <footer style={{ background: '#2f1f14' }}>
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6">
        {/* Top grid */}
        <div className="mb-12 grid gap-10 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <button
              onClick={() => navigate('home')}
              className="group mb-4 flex items-center gap-2"
            >
              <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-105">
                <span className="text-base text-white">🐾</span>
              </div>
              <span
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                className="text-xl font-bold text-white"
              >
                PawHaven
              </span>
            </button>
            <p className="mb-5 text-sm leading-relaxed text-[#b9a596]">
              A collaborative platform connecting reporters, rescuers, and
              adopters — from first sighting to forever home.
            </p>
            {/* Social */}
            <div className="flex gap-2">
              {[
                { icon: <Github className="h-4 w-4" />, label: 'GitHub' },
                { icon: <Twitter className="h-4 w-4" />, label: 'Twitter' },
                { icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
              ].map((s) => (
                <button
                  key={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[#b9a596] transition-colors hover:bg-white/20 hover:text-white"
                  title={s.label}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
            {footerLinks.map((group) => (
              <div key={group.heading}>
                <h4 className="mb-4 text-xs font-semibold tracking-widest text-[#b9a596] uppercase">
                  {group.heading}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => link.page && navigate(link.page)}
                        className="text-left text-sm text-[#d3c3b3] transition-colors hover:text-white"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-3 gap-4 border-t border-b border-white/10 py-6">
          {[
            { value: '2,841', label: 'Animals rescued', icon: '🐾' },
            { value: '384', label: 'Active volunteers', icon: '🙌' },
            { value: '1,203', label: 'Adopted', icon: '🏠' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="mb-0.5 text-xl">{s.icon}</div>
              <div
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                className="text-primary mb-0.5 text-2xl leading-none font-bold"
              >
                {s.value}
              </div>
              <div className="text-xs text-[#8f7b69]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-[#8f7b69] sm:flex-row">
          <p>© 2025 PawHaven. Open source — MIT License.</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span>All systems operational</span>
            <span className="mx-2 text-white/10">|</span>
            <span>Built with ❤️ for every stray life</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────
// Pages that require the user to be signed in
const PROTECTED_PAGES: Page[] = ['report', 'profile'];

function AuthGate({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="bg-card border-border w-full max-w-sm rounded-2xl border p-10 text-center shadow-md">
        <div className="bg-accent mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
          <LogIn className="text-primary h-7 w-7" />
        </div>
        <h2
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          className="text-foreground mb-2 text-xl font-bold"
        >
          Sign in to continue
        </h2>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          You need an account to access this page. It only takes a moment.
        </p>
        <button
          onClick={onSignIn}
          className="bg-primary text-primary-foreground w-full rounded-xl py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
        >
          Sign In / Create Account
        </button>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModal, setAuthModal] = useState<'signin' | 'signup' | null>(null);
  const [pendingPage, setPendingPage] = useState<Page | null>(null);

  const navigate = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // For actions that need auth — e.g. apply-to-adopt button inside a public page
  const requireAuth = (then: () => void) => {
    if (isLoggedIn) {
      then();
    } else {
      setAuthModal('signin');
      // store the callback via a simple flag — handled in onSuccess
    }
  };

  const openCase = (id: string) => {
    setSelectedCaseId(id);
    navigate('case-detail');
  };

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    if (pendingPage) {
      navigate(pendingPage);
      setPendingPage(null);
    }
  };

  const openAuthForPage = (target: Page) => {
    setPendingPage(target);
    setAuthModal('signin');
  };

  const selectedCase = mockCases.find((c) => c.id === selectedCaseId);

  // Check if current page is protected and user isn't logged in
  const isProtected = PROTECTED_PAGES.includes(page) && !isLoggedIn;

  return (
    <div
      className="bg-background flex min-h-screen flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <NavBar
        page={page}
        navigate={navigate}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        isLoggedIn={isLoggedIn}
        onAuthOpen={(mode) => {
          setPendingPage(null);
          setAuthModal(mode);
        }}
        onSignOut={() => {
          setIsLoggedIn(false);
          navigate('home');
        }}
      />

      <div className="flex flex-1 flex-col">
        {isProtected ? (
          <AuthGate onSignIn={() => openAuthForPage(page)} />
        ) : (
          <>
            {page === 'home' && (
              <HomePage
                navigate={navigate}
                openCase={openCase}
                requireAuth={requireAuth}
              />
            )}
            {page === 'case-detail' && selectedCase && (
              <CaseDetailPage
                rescue={selectedCase}
                navigate={navigate}
                isLoggedIn={isLoggedIn}
                onAuthRequired={() => openAuthForPage('home')}
              />
            )}
            {page === 'case-detail' && !selectedCase && (
              <HomePage
                navigate={navigate}
                openCase={openCase}
                requireAuth={requireAuth}
              />
            )}
            {page === 'report' && <ReportWizardPage navigate={navigate} />}
            {page === 'adopt' && (
              <AdoptionPage
                navigate={navigate}
                isLoggedIn={isLoggedIn}
                onAuthRequired={() => openAuthForPage('adopt')}
              />
            )}
            {page === 'stories' && <StoriesPage navigate={navigate} />}
            {page === 'profile' && <ProfilePage navigate={navigate} />}
            {page === 'knowledge' && <KnowledgePage navigate={navigate} />}
          </>
        )}
      </div>

      <SiteFooter navigate={navigate} />

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => {
            setAuthModal(null);
            setPendingPage(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
