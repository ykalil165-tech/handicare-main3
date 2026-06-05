import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/config';
import { useTranslation } from 'react-i18next';
import {
  Accessibility,
  Ambulance,
  Bell,
  Building2,
  CalendarDays,
  Bookmark,
  Ear,
  Eye,
  Flag,
  HeartHandshake,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  Paperclip,
  Navigation,
  Phone,
  Plus,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Stethoscope,
  ThumbsUp,
  Trash2,
  UserCog,
  Users,
  ClipboardList,
} from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

// Données par défaut
// bbox OSM : lng [-7.7, -7.5], lat [33.5, 33.65]
const MAP_BBOX = { lngMin: -7.75, lngMax: -7.50, latMin: 33.48, latMax: 33.65 };
function toMapPos(lat, lng) {
  const left = ((lng - MAP_BBOX.lngMin) / (MAP_BBOX.lngMax - MAP_BBOX.lngMin)) * 100;
  const top  = ((MAP_BBOX.latMax - lat)  / (MAP_BBOX.latMax - MAP_BBOX.latMin))  * 100;
  return { left: `${left.toFixed(2)}%`, top: `${top.toFixed(2)}%` };
}

const TYPE_COLORS = {
  'ASSOCIATION':          '#116a64',
  'REHABILITATION_CENTER':'#0b4c48',
  'PHARMACY':             '#c6512d',
  'DOCTOR':               '#1d6fa4',
  'TRANSPORT':            '#7a3db5',
  'HOSPITAL':             '#b5510d',
  'EMERGENCY':            '#cc1111',
  'EVENT':                '#d4860a',
  'CABINET':              '#1d6fa4',
  'ADMINISTRATIVE_SUPPORT':'#4a7c59',
};

const TYPE_LABELS = {
  'DOCTOR':               { fr:'Médecin',           en:'Doctor',       ar:'طبيب' },
  'ASSOCIATION':          { fr:'Association',        en:'Association',  ar:'جمعية' },
  'EVENT':                { fr:'Événement',          en:'Event',        ar:'حدث' },
  'REHABILITATION_CENTER':{ fr:'Rééducation',        en:'Rehabilitation',ar:'إعادة تأهيل' },
  'CABINET':              { fr:'Cabinet',            en:'Cabinet',      ar:'عيادة' },
  'HOSPITAL':             { fr:'Hôpital',            en:'Hospital',     ar:'مستشفى' },
  'PHARMACY':             { fr:'Pharmacie',          en:'Pharmacy',     ar:'صيدلية' },
  'EMERGENCY':            { fr:'Urgence',            en:'Emergency',    ar:'طوارئ' },
  'TRANSPORT':            { fr:'Transport',          en:'Transport',    ar:'نقل' },
  'ADMINISTRATIVE_SUPPORT':{ fr:'Support administratif', en:'Admin Support', ar:'دعم إداري' },
};

// Données d'initialisation (remplacées par l'API quand le backend est disponible)
const fallbackResources = [
  { id:1,  name:'Association Amal Mobilite',                type:'ASSOCIATION',          description:"Orientation sociale, aide aux dossiers et réseau de transport adapté.",             address:'Maarif, Casablanca',                             phone:'+212 522 00 11 22', email:'contact@handicare.ma', hours:'Lun-Sam, 9:00-18:00', district:'Maarif',            verified:true,  lat:33.5861, lng:-7.6358 },
  { id:2,  name:'Centre Rééducation Anfa',                  type:'REHABILITATION_CENTER',description:"Kinésithérapie, ergothérapie et accompagnement post-traumatique.",                  address:'Anfa, Casablanca',                               phone:'+212 522 22 33 44', email:'contact@handicare.ma', hours:'Lun-Ven, 8:00-17:00', district:'Casablanca-Centre', verified:true,  lat:33.5943, lng:-7.6531 },
  { id:3,  name:'Cabinet Dr El Mansouri',                   type:'DOCTOR',               description:"Médecin généraliste avec communication écrite et accueil des aidants.",             address:'Gauthier, Casablanca',                           phone:'+212 522 44 55 66', email:'contact@handicare.ma', hours:'Lun-Jeu, 9:00-16:00', district:'Casablanca-Centre', verified:true,  lat:33.5902, lng:-7.6264 },
  { id:4,  name:'Atelier Familles Autisme Casa',            type:'EVENT',                description:"Rencontre mensuelle pour parents, orthophonistes et associations.",                 address:'Hay Hassani, Casablanca',                        phone:'+212 522 66 77 88', email:'contact@handicare.ma', hours:'Mensuel, voir planning', district:'Hay-Hassani',       verified:false, lat:33.5657, lng:-7.6846 },
  { id:5,  name:'Pharmacie Access Maarif',                  type:'PHARMACY',             description:"Pharmacie avec livraison de proximité et assistance lecture ordonnance.",           address:'Boulevard Zerktouni, Casablanca',                phone:'+212 522 88 99 00', email:'contact@handicare.ma', hours:'Lun-Sam, 8:30-21:00', district:'Maarif',            verified:false, lat:33.5868, lng:-7.6296 },
  { id:6,  name:'Urgence SAMU Casablanca',                  type:'EMERGENCY',            description:"Contact d'urgence médicale. Ne remplace pas les services d'urgence.",              address:'Casablanca',                                     phone:'141',               email:'contact@handicare.ma', hours:'24h/24',              district:'Casablanca-Centre', verified:true,  lat:33.5731, lng:-7.5898 },
  { id:7,  name:'Transport Adapté Casa',                    type:'TRANSPORT',            description:"Transport accompagné pour fauteuil roulant et trajets médicaux.",                  address:'Casablanca',                                     phone:'+212 522 12 34 56', email:'contact@handicare.ma', hours:'7j/7, 6:00-22:00',   district:'Casablanca-Centre', verified:true,  lat:33.5798, lng:-7.6168 },
  { id:8,  name:'CHU Ibn Rochd',                            type:'HOSPITAL',             description:"Centre hospitalier universitaire majeur de Casablanca.",                           address:'Quartier des Hôpitaux, Casablanca',              phone:'Contact à vérifier', email:'contact@handicare.ma', hours:'24h/24',             district:'Casablanca-Centre', verified:true,  lat:33.5796, lng:-7.6224 },
  { id:9,  name:'Hôpital 20 Août 1953',                     type:'HOSPITAL',             description:"Établissement rattaché au CHU Ibn Rochd avec services spécialisés.",              address:'Boulevard Ibn Rochd, Casablanca',                phone:'Contact à vérifier', email:'contact@handicare.ma', hours:'24h/24',             district:'Casablanca-Centre', verified:true,  lat:33.5826, lng:-7.6209 },
  { id:10, name:"Hôpital d'Enfants Abderrahim Harouchi",    type:'HOSPITAL',             description:"Hôpital pédiatrique du réseau CHU Ibn Rochd.",                                    address:'Quartier des Hôpitaux, Casablanca',              phone:'Contact à vérifier', email:'contact@handicare.ma', hours:'24h/24',             district:'Casablanca-Centre', verified:true,  lat:33.5808, lng:-7.6240 },
  { id:11, name:'CHU International Cheikh Khalifa',         type:'HOSPITAL',             description:"Hôpital universitaire international à Hay Hassani.",                              address:'Boulevard Mohamed Taieb Naciri, Hay Hassani',    phone:'+212 529 00 44 77', email:'contact@handicare.ma', hours:'24h/24',             district:'Hay-Hassani',       verified:true,  lat:33.5553, lng:-7.6654 },
  { id:12, name:'Hôpital Moulay Youssef',                   type:'HOSPITAL',             description:"Hôpital public régional de Casablanca.",                                          address:'112 Bd Moulay Youssef, Casablanca',             phone:'Contact à vérifier', email:'contact@handicare.ma', hours:'24h/24',             district:'Casablanca-Centre', verified:false, lat:33.5982, lng:-7.6320 },
  { id:13, name:'Hôpital Privé Ain Sebaa',                    type:'HOSPITAL',             description:"Hôpital privé pluridisciplinaire à Ain Sebaa. Urgences 24h/24.",                 address:'279 Bd Chefchaouni, Ain Sebaa, Casablanca',     phone:'+212 522 68 00 00', email:'contact@handicare.ma', hours:'24h/24',             district:'Ain-Chock',         verified:true,  lat:33.6053, lng:-7.5355 },
  { id:14, name:'Clinique Badr',                            type:'HOSPITAL',             description:"Clinique connue à Bourgogne, activités médicales et oncologiques.",               address:"35 Rue Imam El Aloussi, Bourgogne, Casablanca", phone:'Contact à vérifier', email:'contact@handicare.ma', hours:'Lun-Sam, 8:00-18:00',district:'Casablanca-Centre', verified:false, lat:33.5985, lng:-7.6437 },
  { id:15, name:'Cabinet Dr Lahlou Orthopédie',             type:'CABINET',              description:"Cabinet spécialisé en orthopédie et appareillage pour personnes handicapées.",    address:'Bd Zerktouni, Maarif, Casablanca',              phone:'+212 522 23 45 67', email:'contact@handicare.ma', hours:'Lun-Ven, 9:00-17:00',district:'Maarif',            verified:true,  lat:33.5872, lng:-7.6401 },
  { id:16, name:'ANAPEC Casablanca — Accompagnement Handicap', type:'ADMINISTRATIVE_SUPPORT', description:"Aide à l'emploi et accompagnement administratif pour personnes en situation de handicap.", address:'Bd Mohammed V, Casablanca',           phone:'+212 522 47 23 11', email:'contact@handicare.ma', hours:'Lun-Ven, 8:30-16:30',district:'Casablanca-Centre', verified:true,  lat:33.5924, lng:-7.6155 },
];

const markApiResource = (resource) => ({ ...resource, _source: 'api' });
const markFallbackResource = (resource) => ({ ...resource, _source: 'fallback' });

const needs = ['motor', 'visual', 'hearing', 'cognitive'];
const districts = ['Maarif', 'Casablanca-Centre', 'Ain-Chock', 'Hay-Hassani', 'Sidi-Moumen', 'Ben-Msik'];

const sortOptions = [
  { value: 'smart', label: 'Classement intelligent' },
  { value: 'rating', label: 'Mieux notes' },
  { value: 'popular', label: 'Plus populaires' },
  { value: 'commented', label: 'Plus commentes' },
  { value: 'visited', label: 'Plus visites' },
  { value: 'recent', label: 'Plus recents' },
  { value: 'verified', label: 'Verifies uniquement' },
];

const communityTags = ['RendezVous', 'Transport', 'FauteuilRoulant', 'Reeducation', 'Accessibilite', 'AideAdministrative', 'Medecin', 'Pharmacie'];

const communityGroups = [
  { id: 'motor', handicapType: 'MOTEUR', name: 'Handicap moteur', description: 'Mobilite reduite, fauteuil roulant, reeducation et accessibilite physique.', members: 128, posts: 34 },
  { id: 'visual', handicapType: 'VISUEL', name: 'Handicap visuel', description: 'Orientation, documents accessibles, accompagnement et ressources visuelles.', members: 84, posts: 21 },
  { id: 'hearing', handicapType: 'AUDITIF', name: 'Handicap auditif', description: 'Communication, services adaptes, interpretes et conseils pratiques.', members: 67, posts: 16 },
  { id: 'cognitive', handicapType: 'COGNITIF', name: 'Handicap cognitif', description: 'Parcours simplifies, aidants, routines et ressources specialisees.', members: 73, posts: 18 },
  { id: 'parents', handicapType: 'PARENTS', name: 'Parents aidants', description: 'Questions de familles, accompagnement quotidien et partage entre aidants.', members: 156, posts: 42 },
  { id: 'associations', handicapType: 'ASSOCIATIONS', name: 'Associations', description: 'Annonces, permanences, evenements et coordination associative.', members: 49, posts: 15 },
  { id: 'health', handicapType: 'SANTE', name: 'Professionnels de sante', description: 'Conseils professionnels, orientation medicale et bonnes pratiques.', members: 58, posts: 12 },
];

const initialCommunityPosts = [
  {
    id: 1,
    author: 'Sara B.',
    avatar: 'SB',
    group: 'Handicap moteur',
    groupId: 'motor',
    handicapType: 'MOTEUR',
    time: 'Publie il y a 2 heures',
    content: "Le centre de reeducation Anfa a installe une nouvelle rampe d'acces. L'entree principale est maintenant accessible aux fauteuils roulants.",
    tags: ['Accessibilite', 'Reeducation', 'FauteuilRoulant'],
    attachments: [
      { type: 'image', title: 'Rampe entree principale', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80' },
      { type: 'document', title: 'Infos accessibilite.pdf' },
    ],
    shares: 3,
    saved: 12,
    reactions: { like: 18, useful: 24, thanks: 9, solidarity: 7 },
    comments: [
      { id: 1, author: 'Yassine', text: "@Sara merci pour l'info, c'est tres utile." },
      { id: 2, author: 'Association Amal', text: "Nous pouvons confirmer, l'acces est plus simple maintenant." },
    ],
    similarPeople: [
      { name: 'Ahmed', context: 'Fauteuil roulant' },
      { name: 'Fatima', context: 'Handicap moteur' },
      { name: 'Youssef', context: 'Mobilite reduite' },
    ],
  },
  {
    id: 2,
    author: 'Association Amal Mobilite',
    avatar: 'AA',
    group: 'Associations',
    groupId: 'associations',
    handicapType: 'ASSOCIATIONS',
    time: 'Hier',
    content: 'Nous organisons samedi une permanence gratuite pour aider les familles a preparer les dossiers administratifs.',
    tags: ['AideAdministrative', 'Accessibilite'],
    attachments: [{ type: 'document', title: 'Programme permanence.pdf' }],
    shares: 8,
    saved: 19,
    reactions: { like: 11, useful: 31, thanks: 13, solidarity: 10 },
    comments: [
      { id: 1, author: 'Nadia', text: 'Est-ce que les parents aidants peuvent venir sans rendez-vous ?' },
    ],
    similarPeople: [
      { name: 'Nadia', context: 'Parent aidant' },
      { name: 'Karim', context: 'Dossier administratif' },
    ],
  },
  {
    id: 3,
    author: 'Omar K.',
    avatar: 'OK',
    group: 'Handicap visuel',
    groupId: 'visual',
    handicapType: 'VISUEL',
    time: 'Cette semaine',
    content: 'La pharmacie Access Maarif propose maintenant une assistance lecture ordonnance. Accueil tres patient.',
    tags: ['Pharmacie', 'Accessibilite'],
    attachments: [],
    shares: 2,
    saved: 7,
    reactions: { like: 14, useful: 19, thanks: 6, solidarity: 5 },
    comments: [],
    similarPeople: [
      { name: 'Imane', context: 'Handicap visuel' },
      { name: 'Rachid', context: 'Ordonnances accessibles' },
    ],
  },
  {
    id: 4,
    author: 'Ahmed L.',
    avatar: 'AL',
    group: 'Handicap moteur',
    groupId: 'motor',
    handicapType: 'MOTEUR',
    time: 'Publie il y a 4 heures',
    content: "Je suis en fauteuil roulant et j'ai des difficultes pour obtenir un rendez-vous rapide dans un centre de reeducation a Casablanca. Avez-vous des recommandations ?",
    tags: ['RendezVous', 'Reeducation', 'FauteuilRoulant'],
    attachments: [],
    shares: 5,
    saved: 22,
    reactions: { like: 26, useful: 33, thanks: 12, solidarity: 18 },
    comments: [
      { id: 1, author: 'Sara B.', text: 'Centre Anfa repond vite si vous appelez le matin.' },
      { id: 2, author: 'Youssef', text: 'J ai eu un rendez-vous en 5 jours chez Cabinet Dr Lahlou.' },
    ],
    similarPeople: [
      { name: 'Fatima', context: 'Reeducation' },
      { name: 'Youssef', context: 'Mobilite reduite' },
      { name: 'Meryem', context: 'Fauteuil roulant' },
    ],
  },
  {
    id: 5,
    author: 'Hajar T.',
    avatar: 'HT',
    group: 'Handicap auditif',
    groupId: 'hearing',
    handicapType: 'AUDITIF',
    time: 'Publie hier',
    content: "Connaissez-vous des medecins a Casablanca qui acceptent l'echange par ecrit pendant la consultation ?",
    tags: ['Medecin', 'Accessibilite', 'RendezVous'],
    attachments: [],
    shares: 1,
    saved: 5,
    reactions: { like: 9, useful: 15, thanks: 4, solidarity: 6 },
    comments: [
      { id: 1, author: 'Nour', text: 'Cabinet Dr El Mansouri accepte les notes ecrites.' },
    ],
    similarPeople: [
      { name: 'Nour', context: 'Handicap auditif' },
      { name: 'Samir', context: 'Consultation ecrite' },
    ],
  },
];

const communityFaqs = [
  { id: 1, title: 'Centres de reeducation recommandes', groupId: 'motor', handicapType: 'MOTEUR', tags: ['Reeducation', 'RendezVous'], answers: 24, reactions: 58, usefulness: 96 },
  { id: 2, title: 'Pharmacies accessibles', groupId: 'visual', handicapType: 'VISUEL', tags: ['Pharmacie', 'Accessibilite'], answers: 16, reactions: 43, usefulness: 89 },
  { id: 3, title: 'Transport adapte', groupId: 'motor', handicapType: 'MOTEUR', tags: ['Transport', 'FauteuilRoulant'], answers: 31, reactions: 64, usefulness: 98 },
  { id: 4, title: 'Aides administratives', groupId: 'parents', handicapType: 'PARENTS', tags: ['AideAdministrative'], answers: 19, reactions: 51, usefulness: 91 },
  { id: 5, title: 'Medecins habitués a communiquer par ecrit', groupId: 'hearing', handicapType: 'AUDITIF', tags: ['Medecin', 'Accessibilite'], answers: 12, reactions: 32, usefulness: 84 },
];

const initialConversations = [
  { id: 1, name: 'Sara B.', type: 'Utilisateur', unread: 2, last: 'Merci pour le contact du transport adapte.', messages: ['Bonjour, est-ce que tu connais un transport accessible ?', 'Oui, Transport Adapte Casa repond rapidement.', 'Merci pour le contact du transport adapte.'] },
  { id: 2, name: 'Association Amal Mobilite', type: 'Association', unread: 1, last: 'Nous avons une permanence demain matin.', messages: ["Bonjour, j'ai besoin d'aide pour un dossier.", 'Nous avons une permanence demain matin.'] },
  { id: 3, name: 'Parents aidants Casa', type: 'Groupe', unread: 0, last: 'Nouvelle ressource partagee dans le groupe.', messages: ['Nouvelle ressource partagee dans le groupe.'] },
];

const initialNotifications = [
  { id: 1, type: 'message', text: 'Sara B. vous a envoye un message', time: 'Il y a 5 min' },
  { id: 2, type: 'comment', text: 'Yassine a commente votre publication', time: 'Il y a 22 min' },
  { id: 3, type: 'like', text: '8 personnes ont trouve votre avis utile', time: "Aujourd'hui" },
  { id: 4, type: 'mention', text: 'Association Amal vous a mentionne dans Parents aidants', time: 'Hier' },
];

function resourceMatchesNeed(resource, selectedNeed) {
  const keys = (resource.disabilityKeys ?? '').toLowerCase().split(',').map((key) => key.trim()).filter(Boolean);
  return !selectedNeed || keys.length === 0 || keys.includes(selectedNeed);
}

function getResourceLat(resource) {
  return resource.lat ?? resource.latitude;
}

function getResourceLng(resource) {
  return resource.lng ?? resource.longitude;
}

function getLocationUrl(resource) {
  const lat = getResourceLat(resource);
  const lng = getResourceLng(resource);
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${resource.name ?? ''} ${resource.address ?? ''}`.trim())}`;
}

function getDirectionsUrl(resource) {
  const lat = getResourceLat(resource);
  const lng = getResourceLng(resource);
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return getLocationUrl(resource);
}

function stableMetric(seed, min, max) {
  const raw = Math.abs(Math.sin(Number(seed) * 999)) * (max - min + 1);
  return min + Math.floor(raw);
}

function getResourceReviewProfile(resource) {
  const id = Number(resource.id ?? 1);
  const averageRating = Number(resource.averageRating ?? resource.googleRating ?? resource.rating ?? (resource.verified ? 4.4 : 3.8));
  const reviewCount = Number(resource.reviewCount ?? resource.googleReviewCount ?? stableMetric(id + 2, 3, 45));
  const favoriteCount = Number(resource.favoriteCount ?? resource.favorites ?? stableMetric(id + 7, 4, 120));
  const viewCount = Number(resource.viewCount ?? resource.views ?? stableMetric(id + 13, 80, 980));
  const recentRank = resource.lastUpdated ? new Date(resource.lastUpdated).getTime() : id;
  const relevanceScore = (averageRating * 0.5) + (reviewCount * 0.2) + (favoriteCount * 0.2) + (viewCount * 0.1);
  return { averageRating, reviewCount, favoriteCount, viewCount, recentRank, relevanceScore };
}

function sortResources(resourcesToSort, sortBy) {
  const filtered = sortBy === 'verified'
    ? resourcesToSort.filter(resource => resource.verified)
    : resourcesToSort;

  return [...filtered].sort((a, b) => {
    const aProfile = getResourceReviewProfile(a);
    const bProfile = getResourceReviewProfile(b);
    if (sortBy === 'rating') return bProfile.averageRating - aProfile.averageRating;
    if (sortBy === 'popular') return bProfile.favoriteCount - aProfile.favoriteCount;
    if (sortBy === 'commented') return bProfile.reviewCount - aProfile.reviewCount;
    if (sortBy === 'visited') return bProfile.viewCount - aProfile.viewCount;
    if (sortBy === 'recent') return bProfile.recentRank - aProfile.recentRank;
    return bProfile.relevanceScore - aProfile.relevanceScore;
  });
}

function Stars({ value = 0, interactive = false, onChange }) {
  const rounded = Math.round(value);
  return (
    <span className={`stars${interactive ? ' interactive' : ''}`} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={star <= rounded ? 'filled' : ''}
          onClick={() => interactive && onChange?.(star)}
          aria-label={`${star} / 5`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

function DifficultyBar({ label, value, tone }) {
  return (
    <div className="difficulty-row">
      <span><i className={`difficulty-dot ${tone}`} />{label}</span>
      <div className="difficulty-track"><b style={{width: `${value}%`}} /></div>
      <strong>{value}%</strong>
    </div>
  );
}

function ResourceMetricStrip({ resource }) {
  const profile = getResourceReviewProfile(resource);
  return (
    <div className="resource-metrics" aria-label="Indicateurs de classement">
      <span><strong>{profile.averageRating.toFixed(1)}</strong> note</span>
      <span><strong>{profile.reviewCount}</strong> avis</span>
      <span><strong>{profile.favoriteCount}</strong> favoris</span>
      <span><strong>{profile.viewCount}</strong> vues</span>
    </div>
  );
}

function ResourceReviews({ resource, authToken, currentAccount, onAuthExpired, t }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, reviewCount: 0, easyPercentage: 0, mediumPercentage: 0, hardPercentage: 0, majorityDifficulty: null });
  const [form, setForm] = useState({ rating: 5, comment: '', appointmentDifficulty: 'MEDIUM' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [message, setMessage] = useState('');
  const isPersistedResource = resource._source !== 'fallback';
  const [resourceExists, setResourceExists] = useState(isPersistedResource);
  const isUser = currentAccount?.accountType === 'USER';
  const isAdmin = currentAccount?.accountType === 'ADMIN';
  const ownReview = reviews.find(review => review.userId === currentAccount?.accountId);
  const headers = { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) };

  const loadReviews = async () => {
    if (!isPersistedResource) {
      setReviews([]);
      setStats({ averageRating: 0, reviewCount: 0, easyPercentage: 0, mediumPercentage: 0, hardPercentage: 0, majorityDifficulty: null });
      return;
    }
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/resources/${resource.id}/reviews`),
        fetch(`${API_URL}/resources/${resource.id}/reviews/stats`)
      ]);
      if (reviewsRes.status === 404 || statsRes.status === 404) {
        setResourceExists(false);
        setMessage(t('reviews.resourceNotFound'));
        return;
      }
      setResourceExists(true);
      if (reviewsRes.ok) setReviews(await reviewsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {}
  };

  useEffect(() => { loadReviews(); }, [resource.id]);

  useEffect(() => {
    if (ownReview && !editingReviewId) {
      setForm({
        rating: ownReview.rating,
        comment: ownReview.comment ?? '',
        appointmentDifficulty: ownReview.appointmentDifficulty ?? 'MEDIUM'
      });
    }
  }, [ownReview?.id]);

  const submitReview = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!isPersistedResource) {
      setMessage(t('reviews.demoResourceNoReviews'));
      return;
    }
    if (!resourceExists) {
      setMessage(t('reviews.resourceNotFound'));
      return;
    }
    const reviewId = editingReviewId ?? ownReview?.id;
    const url = reviewId ? `${API_URL}/reviews/${reviewId}` : `${API_URL}/resources/${resource.id}/reviews`;
    const method = reviewId ? 'PUT' : 'POST';
    const payload = {
      rating: Number(form.rating),
      comment: form.comment?.trim() ?? '',
      appointmentDifficulty: form.appointmentDifficulty
    };
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.status === 401) {
        onAuthExpired?.();
        setMessage(t('reviews.connectez_vous_pour_avis'));
        return;
      }
      if (res.status === 400) {
        setMessage(t('reviews.invalidReview'));
        return;
      }
      if (res.status === 404) {
        setMessage(t('reviews.resourceNotFound'));
        return;
      }
      if (res.status === 409) {
        setMessage(t('reviews.alreadyReviewed'));
        await loadReviews();
        return;
      }
      if (!res.ok) {
        const details = await res.text();
        throw new Error(details || `HTTP ${res.status}`);
      }
      setEditingReviewId(null);
      setMessage(t('reviews.reviewSaved'));
      await loadReviews();
    } catch (error) {
      console.error('Review submission failed', { url, method, payload, error });
      setMessage(t('errors.serverError'));
    }
  };

  const editReview = (review) => {
    setEditingReviewId(review.id);
    setForm({
      rating: review.rating,
      comment: review.comment ?? '',
      appointmentDifficulty: review.appointmentDifficulty ?? 'MEDIUM'
    });
  };

  const deleteReview = async (reviewId) => {
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, { method: 'DELETE', headers });
      if (res.status === 401) {
        onAuthExpired?.();
        setMessage(t('reviews.connectez_vous_pour_avis'));
        return;
      }
      if (!res.ok) throw new Error();
      if (editingReviewId === reviewId) setEditingReviewId(null);
      setMessage(t('reviews.reviewDeleted'));
      await loadReviews();
    } catch {
      setMessage(t('errors.serverError'));
    }
  };

  const majorityLabel = stats.majorityDifficulty ? t(`reviews.difficulty.${stats.majorityDifficulty}`) : t('reviews.noDifficulty');
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(review => Number(review.rating) === rating).length;
    const percentage = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { rating, count, percentage };
  });
  const recentReviews = reviews.slice(0, 3);

  return (
    <section className="reviews-panel">
      <div className="reviews-panel-heading">
        <h4>{t('reviews.avis')}</h4>
        <span>{stats.reviewCount ?? 0} {t('reviews.nombre_avis')}</span>
      </div>
      <div className="reviews-overview">
        <div className="review-score-card">
          <p className="mini-label">{t('reviews.note_moyenne')}</p>
          <div className="rating-line">
            <Stars value={stats.averageRating} />
            <strong>{Number(stats.averageRating ?? 0).toFixed(1)} / 5</strong>
          </div>
          <span className="review-count">Base sur {stats.reviewCount ?? 0} experiences partagees</span>
        </div>
        <div className="review-score-card">
          <p className="mini-label">{t('reviews.difficulte_rendez_vous')}</p>
          <strong className={`majority-difficulty ${(stats.majorityDifficulty ?? 'none').toLowerCase()}`}>
            {majorityLabel}
          </strong>
          <span className="review-count">{t('reviews.majorityDifficulty')}</span>
        </div>
      </div>

      <div className="review-breakdown">
        <div className="rating-breakdown" aria-label="Repartition des notes">
          <p className="mini-label">Repartition des notes</p>
          {ratingDistribution.map(item => (
            <div key={item.rating} className="rating-breakdown-row">
              <span>{item.rating} <span aria-hidden="true">{'\u2605'}</span></span>
              <div className="difficulty-track"><b style={{width: `${item.percentage}%`}} /></div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
        <div className="difficulty-grid" aria-label={t('reviews.difficulte_rendez_vous')}>
          <p className="mini-label">{t('reviews.difficulte_rendez_vous')}</p>
          <DifficultyBar label={t('reviews.facile')} value={stats.easyPercentage ?? 0} tone="easy" />
          <DifficultyBar label={t('reviews.moyen')} value={stats.mediumPercentage ?? 0} tone="medium" />
          <DifficultyBar label={t('reviews.difficile')} value={stats.hardPercentage ?? 0} tone="hard" />
        </div>
      </div>

      <div className="review-comments">
        <h4>Commentaires recents</h4>
        {recentReviews.length === 0 ? (
          <p className="muted-note">{t('reviews.noReviews')}</p>
        ) : recentReviews.map(review => (
          <article key={review.id} className="review-item">
            <div className="review-item-header">
              <div>
                <strong>{review.userName}</strong>
                <small>{t('reviews.difficulte_rendez_vous')}: {t(`reviews.difficulty.${review.appointmentDifficulty}`)}</small>
              </div>
              <span className="compact-stars"><Stars value={review.rating} /></span>
            </div>
            {review.comment && <p>{review.comment}</p>}
            {(isAdmin || review.userId === currentAccount?.accountId) && (
              <div className="review-actions">
                {review.userId === currentAccount?.accountId && (
                  <button type="button" onClick={() => editReview(review)}>{t('reviews.modifier')}</button>
                )}
                <button type="button" onClick={() => deleteReview(review.id)}>{t('reviews.supprimer')}</button>
              </div>
            )}
          </article>
        ))}
      </div>

      {!isPersistedResource ? (
        <p className="login-review-note">{t('reviews.demoResourceNoReviews')}</p>
      ) : !resourceExists ? (
        <p className="login-review-note">{t('reviews.resourceNotFound')}</p>
      ) : isUser ? (
        <form className="review-form" onSubmit={submitReview}>
          <h4>{ownReview ? t('reviews.modifier') : t('reviews.laisser_un_avis')}</h4>
          <Stars value={form.rating} interactive onChange={(rating) => setForm(prev => ({...prev, rating}))} />
          <textarea
            placeholder={t('reviews.commentPlaceholder')}
            value={form.comment}
            onChange={(event) => setForm(prev => ({...prev, comment: event.target.value}))}
          />
          <label>
            <span>{t('reviews.difficulte_rendez_vous')}</span>
            <select
              value={form.appointmentDifficulty}
              onChange={(event) => setForm(prev => ({...prev, appointmentDifficulty: event.target.value}))}
            >
              <option value="EASY">{t('reviews.facile')}</option>
              <option value="MEDIUM">{t('reviews.moyen')}</option>
              <option value="HARD">{t('reviews.difficile')}</option>
            </select>
          </label>
          {message && <p className="review-message">{message}</p>}
          <button type="submit" className="primary-action">{t('reviews.publier')}</button>
        </form>
      ) : (
        <p className="login-review-note">{t('reviews.connectez_vous_pour_avis')}</p>
      )}
    </section>
  );
}

function CommunityPage({ posts, setPosts, joinedGroups, setJoinedGroups }) {
  const [postDraft, setPostDraft] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(communityGroups[0].id);
  const [activeTab, setActiveTab] = useState('wall');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [postTags, setPostTags] = useState(['RendezVous']);
  const [attachmentDraft, setAttachmentDraft] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const activeGroup = communityGroups.find(group => group.id === selectedGroupId) ?? communityGroups[0];

  const groupPosts = useMemo(() => posts.filter(post => post.handicapType === activeGroup.handicapType), [posts, activeGroup.handicapType]);

  const visiblePosts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return groupPosts.filter(post => {
      const matchesTag = selectedTag === 'all' || post.tags?.includes(selectedTag);
      if (!matchesTag) return false;
      if (!normalizedQuery) return true;
      const searchable = [
        post.author,
        post.group,
        post.content,
        ...(post.tags ?? []),
        ...(post.comments ?? []).map(comment => `${comment.author} ${comment.text}`),
      ].join(' ').toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [groupPosts, searchTerm, selectedTag]);

  const popularQuestions = useMemo(() => (
    communityFaqs
      .filter(question => question.handicapType === activeGroup.handicapType)
      .filter(question => selectedTag === 'all' || question.tags.includes(selectedTag))
      .sort((a, b) => (b.answers * 2 + b.reactions + b.usefulness) - (a.answers * 2 + a.reactions + a.usefulness))
  ), [activeGroup.handicapType, selectedTag]);

  const groupTags = useMemo(() => {
    const tags = new Set(communityTags);
    groupPosts.forEach(post => post.tags?.forEach(tag => tags.add(tag)));
    return [...tags];
  }, [groupPosts]);

  const togglePostTag = (tag) => {
    setPostTags(prev => (
      prev.includes(tag)
        ? prev.filter(current => current !== tag)
        : [...prev, tag]
    ));
  };

  const selectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedTag('all');
    setSearchTerm('');
  };

  const publishPost = (event) => {
    event.preventDefault();
    const content = postDraft.trim();
    if (!content) return;
    const attachments = attachmentDraft
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .map((title, index) => ({
        type: /\.(png|jpe?g|webp|gif)$/i.test(title) || title.toLowerCase().includes('photo') || title.toLowerCase().includes('capture') ? 'image' : 'document',
        title,
        url: index === 0 && title.toLowerCase().includes('photo')
          ? 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80'
          : undefined,
      }));
    setPosts(prev => [{
      id: Date.now(),
      author: 'Vous',
      avatar: 'VO',
      group: activeGroup.name,
      groupId: activeGroup.id,
      handicapType: activeGroup.handicapType,
      time: "A l'instant",
      content,
      tags: postTags.length ? postTags : ['Accessibilite'],
      attachments,
      shares: 0,
      saved: 0,
      reactions: { like: 0, useful: 0, thanks: 0, solidarity: 0 },
      comments: [],
      similarPeople: [
        { name: 'Ahmed', context: activeGroup.name },
        { name: 'Fatima', context: activeGroup.description.split(',')[0] },
        { name: 'Youssef', context: 'Situation similaire' },
      ],
    }, ...prev]);
    setPostDraft('');
    setAttachmentDraft('');
  };

  const reactToPost = (postId, reaction) => {
    setPosts(prev => prev.map(post => (
      post.id === postId
        ? { ...post, reactions: { ...post.reactions, [reaction]: (post.reactions[reaction] ?? 0) + 1 } }
        : post
    )));
  };

  const addComment = (postId) => {
    const text = (commentDrafts[postId] ?? '').trim();
    if (!text) return;
    setPosts(prev => prev.map(post => (
      post.id === postId
        ? { ...post, comments: [...post.comments, { id: Date.now(), author: 'Vous', text }] }
        : post
    )));
    setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
  };

  const savePost = (postId) => {
    setPosts(prev => prev.map(post => (
      post.id === postId ? { ...post, saved: (post.saved ?? 0) + 1 } : post
    )));
  };

  const sharePost = (postId) => {
    setPosts(prev => prev.map(post => (
      post.id === postId ? { ...post, shares: (post.shares ?? 0) + 1 } : post
    )));
  };

  return (
    <section className="community-section">
      <div className="community-hero">
        <div>
          <p className="eyebrow">Communaute HandiCare</p>
          <h1>{activeGroup.name}</h1>
          <p>{activeGroup.description} Chaque groupe dispose de son propre mur, de ses questions populaires et de ses discussions ciblees.</p>
        </div>
      </div>

      <div className="community-layout">
        <aside className="community-sidebar">
          <h2>Communautes</h2>
          {communityGroups.map(group => {
            const joined = joinedGroups.includes(group.id);
            const isActive = activeGroup.id === group.id;
            const livePosts = posts.filter(post => post.handicapType === group.handicapType).length;
            return (
              <div key={group.id} className={isActive ? 'group-row active-group' : 'group-row'}>
                <button type="button" className="group-selector" onClick={() => selectGroup(group.id)}>
                  <strong>{group.name}</strong>
                  <span>{group.members} membres - {livePosts} publications</span>
                </button>
                <button
                  type="button"
                  className={joined ? 'join-button joined' : 'join-button'}
                  onClick={() => setJoinedGroups(prev => joined ? prev.filter(id => id !== group.id) : [...prev, group.id])}
                >
                  {joined ? 'Rejoint' : 'Rejoindre'}
                </button>
              </div>
            );
          })}
        </aside>

        <div className="community-feed">
          <div className="community-toolbar">
            <label className="community-search">
              <Search size={18} />
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Rechercher dans la communaute"
              />
            </label>
            <div className="community-tabs" role="tablist" aria-label="Vues communaute">
              <button type="button" className={activeTab === 'wall' ? 'active-tab' : ''} onClick={() => setActiveTab('wall')}>Mur</button>
              <button type="button" className={activeTab === 'questions' ? 'active-tab' : ''} onClick={() => setActiveTab('questions')}>Questions populaires</button>
            </div>
          </div>

          <div className="tag-filter-row" aria-label="Filtrer par tag">
            <button type="button" className={selectedTag === 'all' ? 'active-tag' : ''} onClick={() => setSelectedTag('all')}>Tous</button>
            {groupTags.map(tag => (
              <button key={tag} type="button" className={selectedTag === tag ? 'active-tag' : ''} onClick={() => setSelectedTag(tag)}>
                #{tag}
              </button>
            ))}
          </div>

          <form className="composer" onSubmit={publishPost}>
            <div className="composer-top">
              <div className="composer-avatar">VO</div>
              <div>
                <strong>Publier dans {activeGroup.name}</strong>
                <span>Visible uniquement pour publication.handicapType === "{activeGroup.handicapType}"</span>
              </div>
            </div>
            <textarea
              value={postDraft}
              onChange={event => setPostDraft(event.target.value)}
              placeholder="Posez une question, partagez une experience, recommandez une ressource..."
            />
            <div className="composer-tags">
              {communityTags.map(tag => (
                <button key={tag} type="button" className={postTags.includes(tag) ? 'selected' : ''} onClick={() => togglePostTag(tag)}>#{tag}</button>
              ))}
            </div>
            <label className="attachment-input">
              <Paperclip size={17} />
              <input
                value={attachmentDraft}
                onChange={event => setAttachmentDraft(event.target.value)}
                placeholder="Ajouter photos, documents, captures (separes par des virgules)"
              />
            </label>
            <button type="submit" className="primary-action"><Send size={16} /> Publier</button>
          </form>

          {activeTab === 'questions' ? (
            <div className="popular-questions">
              {popularQuestions.length ? popularQuestions.map(question => (
                <article key={question.id} className="question-card">
                  <div>
                    <strong>{question.title}</strong>
                    <span>{question.answers} reponses - {question.reactions} reactions - utilite {question.usefulness}%</span>
                  </div>
                  <div className="post-tags">
                    {question.tags.map(tag => <button key={tag} type="button" onClick={() => setSelectedTag(tag)}>#{tag}</button>)}
                  </div>
                </article>
              )) : (
                <p className="empty-community">Aucune question populaire ne correspond encore a ce filtre.</p>
              )}
            </div>
          ) : visiblePosts.length ? visiblePosts.map(post => (
            <article key={post.id} className="community-post">
              <div className="post-header">
                <div className="post-author-block">
                  <div className="post-avatar">{post.avatar ?? post.author.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{post.author}</strong>
                    <span>{post.group} - {post.time}</span>
                  </div>
                </div>
                <button type="button" className="ghost-icon"><Flag size={16} /> Signaler</button>
              </div>
              <p className="post-content">{post.content}</p>
              <div className="post-tags">
                {post.tags?.map(tag => <button key={tag} type="button" onClick={() => setSelectedTag(tag)}>#{tag}</button>)}
              </div>
              {!!post.attachments?.length && (
                <div className="post-gallery">
                  {post.attachments.map((attachment, index) => (
                    <div key={`${attachment.title}-${index}`} className={attachment.type === 'image' ? 'gallery-item image-item' : 'gallery-item document-item'}>
                      {attachment.type === 'image' && attachment.url ? (
                        <img src={attachment.url} alt={attachment.title} />
                      ) : (
                        <ImageIcon size={22} />
                      )}
                      <span>{attachment.title}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="post-stats">
                <span>{post.reactions.like} J'aime</span>
                <span>{post.reactions.useful} Utile</span>
                <span>{post.reactions.thanks} Merci</span>
                <span>{post.reactions.solidarity} Solidaire</span>
                <span>{post.comments.length} commentaires</span>
                <span>{post.shares ?? 0} partages</span>
              </div>
              <div className="reaction-row">
                <button type="button" onClick={() => reactToPost(post.id, 'like')}><ThumbsUp size={15} /> J'aime</button>
                <button type="button" onClick={() => reactToPost(post.id, 'useful')}><HeartHandshake size={15} /> Utile</button>
                <button type="button" onClick={() => reactToPost(post.id, 'thanks')}>Merci</button>
                <button type="button" onClick={() => reactToPost(post.id, 'solidarity')}>Solidaire</button>
                <button type="button" onClick={() => sharePost(post.id)}><Share2 size={15} /> Partager</button>
                <button type="button" onClick={() => savePost(post.id)}><Bookmark size={15} /> Enregistrer</button>
              </div>
              {!!post.similarPeople?.length && (
                <div className="similar-people">
                  <strong>Personnes ayant rencontre un probleme similaire</strong>
                  <div>
                    {post.similarPeople.map(person => (
                      <span key={`${post.id}-${person.name}`}><b>{person.name}</b>{person.context}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="comments-thread">
                {post.comments.map(comment => (
                  <div key={comment.id} className="comment-bubble">
                    <strong>{comment.author}</strong>
                    <span>{comment.text}</span>
                    <button type="button">Repondre</button>
                  </div>
                ))}
                <div className="comment-input">
                  <input
                    value={commentDrafts[post.id] ?? ''}
                    onChange={event => setCommentDrafts(prev => ({ ...prev, [post.id]: event.target.value }))}
                    placeholder="Ajouter un commentaire ou mentionner @utilisateur"
                  />
                  <button type="button" onClick={() => addComment(post.id)}>Commenter</button>
                </div>
              </div>
            </article>
          )) : (
            <p className="empty-community">Aucune publication de cette communaute ne correspond a la recherche ou au tag choisi.</p>
          )}
        </div>

        <aside className="moderation-panel">
          <h2>{activeGroup.name}</h2>
          <p>{groupPosts.length} publications filtrees automatiquement sur le type {activeGroup.handicapType}. Les contenus des autres groupes restent exclus de ce mur.</p>
          <div className="community-side-stat"><strong>{visiblePosts.length}</strong><span>resultats affiches</span></div>
          <div className="community-side-stat"><strong>{popularQuestions.length}</strong><span>questions populaires</span></div>
          <button type="button" className="secondary-action"><Flag size={16} /> Voir les signalements</button>
        </aside>
      </div>
    </section>
  );
}

function ChatPage({ conversations, setConversations }) {
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? null);
  const [messageDraft, setMessageDraft] = useState('');
  const activeConversation = conversations.find(conversation => conversation.id === activeId) ?? conversations[0];

  const sendMessage = (event) => {
    event.preventDefault();
    const text = messageDraft.trim();
    if (!text || !activeConversation) return;
    setConversations(prev => prev.map(conversation => (
      conversation.id === activeConversation.id
        ? { ...conversation, last: text, messages: [...conversation.messages, text], unread: 0 }
        : conversation
    )));
    setMessageDraft('');
  };

  return (
    <section className="chat-section">
      <div className="section-heading">
        <p className="eyebrow">Messagerie</p>
        <h1>Chat prive et associations</h1>
      </div>
      <div className="chat-shell">
        <aside className="conversation-list">
          {conversations.map(conversation => (
            <button
              key={conversation.id}
              type="button"
              className={activeConversation?.id === conversation.id ? 'active-conversation' : ''}
              onClick={() => {
                setActiveId(conversation.id);
                setConversations(prev => prev.map(item => item.id === conversation.id ? { ...item, unread: 0 } : item));
              }}
            >
              <strong>{conversation.name}</strong>
              <span>{conversation.type}</span>
              <small>{conversation.last}</small>
              {conversation.unread > 0 && <b>{conversation.unread}</b>}
            </button>
          ))}
        </aside>
        <div className="chat-window">
          <div className="chat-window-header">
            <MessageCircle size={20} />
            <div>
              <strong>{activeConversation?.name}</strong>
              <span>Historique des conversations</span>
            </div>
          </div>
          <div className="message-list">
            {activeConversation?.messages.map((message, index) => (
              <p key={`${activeConversation.id}-${index}`} className={index % 2 === 0 ? 'message theirs' : 'message mine'}>{message}</p>
            ))}
          </div>
          <form className="message-form" onSubmit={sendMessage}>
            <input value={messageDraft} onChange={event => setMessageDraft(event.target.value)} placeholder="Ecrire un message..." />
            <button type="submit" className="primary-action"><Send size={16} /> Envoyer</button>
          </form>
        </div>
      </div>
    </section>
  );
}

function NotificationsPage({ notifications }) {
  return (
    <section className="notifications-section">
      <div className="section-heading">
        <p className="eyebrow">Notifications</p>
        <h1>Activite recente</h1>
      </div>
      <div className="notification-list">
        {notifications.map(notification => (
          <article key={notification.id} className="notification-card">
            <Bell size={18} />
            <div>
              <strong>{notification.text}</strong>
              <span>{notification.time}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LeafletMap({ resources, selectedType, selectedDistrict, selectedNeed, query, language }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersLayer = useRef(null);

  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    if (!leafletMap.current) {
      leafletMap.current = window.L.map(mapRef.current, { zoomControl: true }).setView([33.573, -7.589], 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(leafletMap.current);
      markersLayer.current = window.L.layerGroup().addTo(leafletMap.current);
    }
  }, []);

  useEffect(() => {
    if (!window.L || !leafletMap.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();
    const filtered = resources
      .filter(r => selectedType === 'ALL' || r.type === selectedType)
      .filter(r => resourceMatchesNeed(r, selectedNeed))
      .filter(r => selectedDistrict === 'all' || r.district === selectedDistrict || (r.address ?? '').toLowerCase().includes(selectedDistrict.toLowerCase().replace('-', ' ')))
      .filter(r => !query || r.name.toLowerCase().includes(query.toLowerCase()) || (r.description ?? '').toLowerCase().includes(query.toLowerCase()))
      .filter(r => (r.lat || r.latitude) && (r.lng || r.longitude));

    filtered.forEach(r => {
      const lat = r.lat ?? r.latitude;
      const lng = r.lng ?? r.longitude;
      const color = TYPE_COLORS[r.type] ?? '#116a64';
      const label = (TYPE_LABELS[r.type])?.[language] ?? r.type;
      const icon = window.L.divIcon({
        className: '',
        html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
          <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z'/><circle cx='12' cy='10' r='3'/></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = window.L.marker([lat, lng], { icon });
      marker.bindPopup(`<strong>${r.name}</strong><br/><span style="color:#666;font-size:0.85rem">${label}</span><br/><span style="font-size:0.82rem">${r.address ?? ''}</span>`);
      markersLayer.current.addLayer(marker);
    });
  }, [resources, selectedType, selectedDistrict, selectedNeed, query, language]);

  return <div ref={mapRef} style={{width:'100%', height:'520px', borderRadius:'8px', overflow:'hidden', border:'1px solid #ddd'}} />;
}

function AdminDashboard({ authToken, t, language }) {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [resources, setAdminResources] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', role: 'Administrateur', password: '' });
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [loadingPending, setLoadingPending] = useState(false);
  const emptyResource = { name:'', type:'ASSOCIATION', disabilityKeys:'motor', description:'', address:'', latitude:'', longitude:'', phone:'', email:'', openingHours:'', accessibilityScore:'80', accessibilityFeatures:'', verified:false, services:'', languages:'Arabe, Francais' };
  const [newResource, setNewResource] = useState(emptyResource);
  const [addResError, setAddResError] = useState('');
  const [addResSuccess, setAddResSuccess] = useState('');
  const [addResLoading, setAddResLoading] = useState(false);

  const headers = { 'Content-Type': 'application/json', ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}) };

  const fetchPending = async () => {
    setLoadingPending(true);
    try {
      const res = await fetch(`${API_URL}/associations/pending`, { headers });
      if (res.ok) setPending(await res.json());
    } finally { setLoadingPending(false); }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/admins`, { headers });
      if (res.ok) setAdmins(await res.json());
    } catch {}
  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_URL}/resources`, { headers });
      if (res.ok) setAdminResources(await res.json());
      else setAdminResources(fallbackResources);
    } catch { setAdminResources(fallbackResources); }
  };

  useEffect(() => { fetchPending(); fetchAdmins(); fetchResources(); }, []);

  const approveAssoc = async (id) => {
    try {
      const res = await fetch(`${API_URL}/associations/${id}/verify`, { method: 'PATCH', headers });
      if (res.ok) { setPending(p => p.filter(a => a.id !== id)); setAdminSuccess(t('admin.approveAssociation') + ' ✓'); }
    } catch { setAdminError(t('errors.serverError')); }
  };

  const rejectAssoc = async (id) => {
    try {
      const res = await fetch(`${API_URL}/associations/${id}/reject`, { method: 'PATCH', headers });
      if (res.ok) { setPending(p => p.filter(a => a.id !== id)); setAdminSuccess(t('admin.rejectAssociation') + ' ✓'); }
    } catch { setAdminError(t('errors.serverError')); }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    setAdminError(''); setAdminSuccess('');
    try {
      const res = await fetch(`${API_URL}/admins`, {
        method: 'POST', headers,
        body: JSON.stringify({ fullName: newAdmin.fullName, email: newAdmin.email, role: newAdmin.role, passwordHash: newAdmin.password })
      });
      if (res.ok) {
        const created = await res.json();
        setAdmins(a => [...a, created]);
        setNewAdmin({ fullName: '', email: '', role: 'Administrateur', password: '' });
        setAdminSuccess(t('admin.addAdmin') + ' ✓');
      } else { setAdminError(t('errors.emailAlreadyExists')); }
    } catch { setAdminError(t('errors.serverError')); }
  };

  const deleteAdmin = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admins/${id}`, { method: 'DELETE', headers });
      if (res.ok) setAdmins(a => a.filter(x => x.id !== id));
    } catch {}
  };

  const deleteResource = async (id) => {
    try {
      const res = await fetch(`${API_URL}/resources/${id}`, { method: 'DELETE', headers });
      if (res.ok) setAdminResources(r => r.filter(x => x.id !== id));
    } catch {}
  };

  const addResource = async (e) => {
    e.preventDefault();
    setAddResError(''); setAddResSuccess('');
    setAddResLoading(true);
    try {
      const payload = {
        ...newResource,
        latitude:  newResource.latitude  ? parseFloat(newResource.latitude)  : null,
        longitude: newResource.longitude ? parseFloat(newResource.longitude) : null,
        accessibilityScore: newResource.accessibilityScore ? parseInt(newResource.accessibilityScore) : 70,
        verified: newResource.verified,
        lastUpdated: new Date().toISOString().slice(0,10),
      };
      const res = await fetch(`${API_URL}/resources`, {
        method: 'POST', headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setAdminResources(r => [created, ...r]);
      setNewResource(emptyResource);
      setAddResSuccess('Ressource ajoutée avec succès ✓');
    } catch {
      setAddResError(t('errors.serverError'));
    } finally { setAddResLoading(false); }
  };

  return (
    <section className="admin-section">
      <div className="admin-header">
        <h1>{t('admin.title')}</h1>
        <p className="eyebrow">{t('admin.generalView')}</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-num">{resources.length}</span>
          <span className="stat-label">{t('admin.totalResources')}</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-num">{pending.length}</span>
          <span className="stat-label">{t('admin.pendingAssociations')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{admins.length}</span>
          <span className="stat-label">{t('admin.totalAdmins')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{resources.filter(r => r.verified).length}</span>
          <span className="stat-label">{t('admin.verifiedResources')}</span>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'pending' ? 'active-nav' : ''} onClick={() => setTab('pending')}>
          {t('admin.pending')} {pending.length > 0 && <span className="badge">{pending.length}</span>}
        </button>
        <button className={tab === 'admins' ? 'active-nav' : ''} onClick={() => setTab('admins')}>
          {t('admin.admins')}
        </button>
        <button className={tab === 'resources' ? 'active-nav' : ''} onClick={() => setTab('resources')}>
          {t('admin.resources')}
        </button>
        <button className={tab === 'add-resource' ? 'active-nav' : ''} onClick={() => setTab('add-resource')} style={{color:'var(--accent)', fontWeight:800}}>
          {t('addResource.tabLabel')}
        </button>
      </div>

      {(adminError || adminSuccess) && (
        <div className={adminError ? 'form-error' : 'form-success'} style={{margin:'0 0 1rem', padding:'0.6rem 1rem', borderRadius:'8px', background: adminError ? '#fee' : '#efe', color: adminError ? '#c00' : '#060'}}>
          {adminError || adminSuccess}
          <button style={{float:'right', background:'none', border:'none', cursor:'pointer'}} onClick={() => { setAdminError(''); setAdminSuccess(''); }}>✕</button>
        </div>
      )}

      {tab === 'pending' && (
        <div className="admin-list">
          {loadingPending && <p>{t('common.loading')}</p>}
          {!loadingPending && pending.length === 0 && (
            <div className="empty-state"><p>Aucune association en attente de validation.</p></div>
          )}
          {pending.map(assoc => (
            <div key={assoc.id} className="admin-card">
              <div className="admin-card-header">
                <h3>{assoc.associationName}</h3>
                <span className="status-pill pending">{t('admin.pending')}</span>
              </div>
              <dl className="admin-card-details">
                <dt>{t('resources.email')}</dt><dd dir="ltr">{assoc.email}</dd>
                <dt>{t('resources.phone')}</dt><dd dir="ltr">{assoc.phone}</dd>
                <dt>{t('resources.address')}</dt><dd>{assoc.address}</dd>
                {assoc.description && <><dt>{t('resources.description')}</dt><dd>{assoc.description}</dd></>}
                {assoc.contactPerson && <><dt>Contact</dt><dd>{assoc.contactPerson}</dd></>}
                {assoc.disabilityKeys && <><dt>Besoins</dt><dd>{assoc.disabilityKeys}</dd></>}
              </dl>
              <div className="admin-card-actions">
                <button className="primary-action approve-btn" onClick={() => approveAssoc(assoc.id)}>
                  <ShieldCheck size={15} /> {t('admin.approveAssociation')}
                </button>
                <button className="danger-btn" onClick={() => rejectAssoc(assoc.id)}>
                  ✕ {t('admin.rejectAssociation')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'admins' && (
        <div className="admin-list">
          <div className="admin-card add-admin-form">
            <h3>{t('admin.addAdmin')}</h3>
            <form onSubmit={addAdmin} className="auth-form inline-form">
              <input type="text" placeholder="Nom complet" value={newAdmin.fullName} onChange={e => setNewAdmin(f => ({...f, fullName: e.target.value}))} required />
              <input type="email" placeholder={t('auth.email')} value={newAdmin.email} onChange={e => setNewAdmin(f => ({...f, email: e.target.value}))} dir="ltr" required />
              <input type="text" placeholder="Rôle" value={newAdmin.role} onChange={e => setNewAdmin(f => ({...f, role: e.target.value}))} />
              <input type="password" placeholder={t('auth.password')} value={newAdmin.password} onChange={e => setNewAdmin(f => ({...f, password: e.target.value}))} required />
              <button type="submit" className="primary-action">{t('admin.addAdmin')}</button>
            </form>
          </div>
          {admins.map(admin => (
            <div key={admin.id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>{admin.fullName}</h3>
                  <p style={{fontSize:'0.85rem', color:'var(--muted)', marginTop:'2px'}} dir="ltr">{admin.email}</p>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <span className={`status-pill ${admin.principal ? 'verified' : 'pending'}`}>{admin.role ?? 'Admin'}</span>
                  {!admin.principal && (
                    <button className="danger-btn small-btn" onClick={() => deleteAdmin(admin.id)} title={t('admin.removeAdmin')}>✕</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'resources' && (
        <div className="admin-list">
          {resources.map(res => (
            <div key={res.id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>{res.name}</h3>
                  <p style={{fontSize:'0.85rem', color:'var(--muted)', marginTop:'2px'}}>{res.address}</p>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <span className="type-pill" style={{background: TYPE_COLORS[res.type] ?? '#116a64', fontSize:'0.75rem'}}>
                    {(TYPE_LABELS[res.type])?.[language] ?? res.type}
                  </span>
                  {res.verified && <span className="status-pill verified"><ShieldCheck size={11} /></span>}
                  <button className="danger-btn small-btn" onClick={() => deleteResource(res.id)} title={t('admin.deleteResource')}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'add-resource' && (
        <div className="association-signup" style={{padding:'0', background:'none'}}>
          {addResSuccess && (
            <div className="form-success" style={{marginBottom:'1.25rem'}}>
              <h3 style={{margin:'0 0 0.3rem'}}>✓ {t('addResource.successTitle')}</h3>
              <p style={{margin:0}}>{t('addResource.successMsg')}</p>
              <button className="primary-action" style={{marginTop:'0.75rem'}} onClick={() => setAddResSuccess('')}>{t('addResource.addAnother')}</button>
            </div>
          )}
          {!addResSuccess && (
            <form className="association-form" onSubmit={addResource}>
              {/* Ligne 1 : Nom + Type */}
              <input required placeholder={t('addResource.resourceName')} value={newResource.name} onChange={e => setNewResource(f => ({...f, name: e.target.value}))} />
              <select value={newResource.type} onChange={e => setNewResource(f => ({...f, type: e.target.value}))} style={{gridColumn:'span 1'}}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v[language] ?? v['fr']}</option>)}
              </select>
              {/* Ligne 2 : Email + Téléphone + Adresse */}
              <input type="email" placeholder={t('addResource.email')} dir="ltr" value={newResource.email} onChange={e => setNewResource(f => ({...f, email: e.target.value}))} />
              <input type="tel" placeholder={t('addResource.phone')} dir="ltr" value={newResource.phone} onChange={e => setNewResource(f => ({...f, phone: e.target.value}))} />
              <input placeholder={t('addResource.address')} value={newResource.address} onChange={e => setNewResource(f => ({...f, address: e.target.value}))} style={{gridColumn:'span 2'}} />
              {/* Ligne 3 : GPS */}
              <div style={{gridColumn:'1 / -1', background:'var(--soft)', borderRadius:'10px', padding:'1rem', border:'1px solid var(--line)'}}>
                <p style={{margin:'0 0 0.5rem', fontWeight:700, fontSize:'0.9rem'}}>
                  📍 {t('addResource.gpsTitle')} —{' '}
                  <a href="https://www.openstreetmap.org/#map=13/33.573/-7.589" target="_blank" rel="noopener noreferrer" style={{color:'var(--primary)'}}>
                    {t('addResource.gpsOsmLink')}
                  </a>
                </p>
                <p style={{margin:'0 0 0.75rem', fontSize:'0.82rem', color:'var(--muted)'}}>
                  Cliquez sur votre emplacement sur la carte, puis copiez les coordonnées depuis l'URL (ex: #map=17/<strong>33.5861</strong>/<strong>-7.6358</strong>)
                </p>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem'}}>
                  <input
                    type="text" inputMode="decimal" placeholder={t('addResource.latitudePlaceholder')} dir="ltr"
                    value={newResource.latitude}
                    onChange={e => setNewResource(f => ({...f, latitude: e.target.value.replace(',','.')}))}
                  />
                  <input
                    type="text" inputMode="decimal" placeholder={t('addResource.longitudePlaceholder')} dir="ltr"
                    value={newResource.longitude}
                    onChange={e => setNewResource(f => ({...f, longitude: e.target.value.replace(',','.')}))}
                  />
                </div>
                {newResource.latitude && newResource.longitude && (
                  <div style={{borderRadius:'6px', overflow:'hidden', height:'200px', marginTop:'0.75rem'}}>
                    <iframe
                      title="Prévisualisation position"
                      style={{width:'100%', height:'100%', border:0}}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(newResource.longitude)-0.01}%2C${parseFloat(newResource.latitude)-0.007}%2C${parseFloat(newResource.longitude)+0.01}%2C${parseFloat(newResource.latitude)+0.007}&layer=mapnik&marker=${newResource.latitude}%2C${newResource.longitude}`}
                    />
                  </div>
                )}
              </div>
              {/* Ligne 4 : Horaires + Score + Besoins */}
              <input placeholder={t('addResource.openingHours')} value={newResource.openingHours} onChange={e => setNewResource(f => ({...f, openingHours: e.target.value}))} />
              <input type="number" min="0" max="100" placeholder={t('addResource.accessibilityScore')} value={newResource.accessibilityScore} onChange={e => setNewResource(f => ({...f, accessibilityScore: e.target.value}))} />
              <input placeholder={t('addResource.disabilityKeys')} value={newResource.disabilityKeys} onChange={e => setNewResource(f => ({...f, disabilityKeys: e.target.value}))} style={{gridColumn:'span 2'}} />
              {/* Ligne 5 : Accessibilité + Services */}
              <input placeholder={t('addResource.accessibilityFeatures')} value={newResource.accessibilityFeatures} onChange={e => setNewResource(f => ({...f, accessibilityFeatures: e.target.value}))} style={{gridColumn:'span 2'}} />
              <textarea rows={3} placeholder={t('addResource.services')} value={newResource.services} onChange={e => setNewResource(f => ({...f, services: e.target.value}))} style={{gridColumn:'span 2'}} />
              {/* Description */}
              <textarea rows={3} placeholder={t('addResource.description')} value={newResource.description} onChange={e => setNewResource(f => ({...f, description: e.target.value}))} style={{gridColumn:'span 4'}} required />
              {/* Checkbox vérifié */}
              <label style={{gridColumn:'span 4', display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:600, cursor:'pointer'}}>
                <input type="checkbox" checked={newResource.verified} onChange={e => setNewResource(f => ({...f, verified: e.target.checked}))} style={{width:'auto'}} />
                {t('addResource.markVerified')}
              </label>
              {addResError && <p className="form-error" style={{gridColumn:'span 4'}}>{addResError}</p>}
              <button type="submit" className="primary-action" disabled={addResLoading} style={{gridColumn:'span 4', padding:'0.9rem', fontSize:'1rem'}}>
                {addResLoading ? t('common.loading') : t('addResource.submitBtn')}
              </button>
              <p style={{gridColumn:'span 4', fontSize:'0.82rem', color:'var(--muted)', margin:0}}>
                {t('addResource.unverifiedNote')}
              </p>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

function App() {
  const { i18n, t } = useTranslation();
  const [section, setSection] = useState('home');
  const [adminTab, setAdminTab] = useState('overview');
  const [selectedNeed, setSelectedNeed] = useState('motor');
  const [selectedNeeds, setSelectedNeeds] = useState([]);   // checkboxes handicap sur page Ressources
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedSort, setSelectedSort] = useState('smart');
  const [communityPosts, setCommunityPosts] = useState(initialCommunityPosts);
  const [joinedGroups, setJoinedGroups] = useState(['motor', 'parents']);
  const [conversations, setConversations] = useState(initialConversations);
  const [notifications] = useState(initialNotifications);

  const toggleNeed = (need) => setSelectedNeeds(prev =>
    prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
  );

  const goToResource = (resource) => {
    setSelectedType(resource.type ?? 'ALL');
    setSelectedDistrict('all');
    setQuery(resource.name);
    setSection('map');
  };
  const [resources, setResources] = useState(() => fallbackResources.map(markFallbackResource));
  const [admins, setAdmins] = useState([]);
  const [pendingAssociations, setPendingAssociations] = useState([]);
  const [associationMessage, setAssociationMessage] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('handicare_lang') ?? 'fr';
    i18n.changeLanguage(saved);
    return saved;
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('handicare_auth_token') ?? '');
  const [currentAdmin, setCurrentAdmin] = useState(() => {
    const stored = localStorage.getItem('handicare_auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loginError, setLoginError] = useState('');
  const [query, setQuery] = useState('');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', preferredNeed: 'motor' });
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError(t('errors.passwordMismatch')); return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: registerForm.fullName, email: registerForm.email, password: registerForm.password, preferredNeed: registerForm.preferredNeed })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAuthToken(data.token);
      setCurrentAdmin(data.user ?? data);
      localStorage.setItem('handicare_auth_token', data.token);
      localStorage.setItem('handicare_auth_user', JSON.stringify(data.user ?? data));
      setRegisterSuccess(true);
    } catch {
      setRegisterError(t('errors.emailAlreadyExists'));
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('handicare_lang', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const clearAuthSession = () => {
    setCurrentAdmin(null);
    setAuthToken('');
    localStorage.removeItem('handicare_auth_token');
    localStorage.removeItem('handicare_auth_user');
  };

  useEffect(() => {
    if (!authToken) return;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async res => {
        if (!res.ok) {
          clearAuthSession();
          return;
        }
        const account = await res.json();
        setCurrentAdmin(account);
        localStorage.setItem('handicare_auth_user', JSON.stringify(account));
      })
      .catch(() => {});
  }, [authToken]);

  // Charger les ressources depuis l'API (remplace fallback si backend disponible)
  useEffect(() => {
    fetch(`${API_URL}/resources`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (Array.isArray(data)) setResources(data.map(markApiResource)); })
      .catch(() => {});
  }, []);

  const [assocForm, setAssocForm] = useState({
    associationName: '', email: '', passwordHash: '', confirmPassword: '',
    phone: '', address: '', latitude: '', longitude: '',
    disabilityKeys: '', services: '', description: '', contactPerson: ''
  });
  const [assocSuccess, setAssocSuccess] = useState(false);
  const [assocError, setAssocError] = useState('');

  const handleAssocRegister = async (e) => {
    e.preventDefault();
    setAssocError('');
    if (assocForm.passwordHash !== assocForm.confirmPassword) {
      setAssocError(t('errors.passwordMismatch')); return;
    }
    try {
      const { confirmPassword, ...payload } = assocForm;
      const res = await fetch(`${API_URL}/associations/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          latitude: payload.latitude ? parseFloat(payload.latitude) : null,
          longitude: payload.longitude ? parseFloat(payload.longitude) : null,
        })
      });
      if (!res.ok) throw new Error();
      setAssocSuccess(true);
    } catch {
      setAssocError(t('errors.serverError'));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const email = loginForm.email.trim();
    if (!email || !loginForm.password) {
      setLoginError(t('errors.required'));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLoginError(t('errors.invalidEmail'));
      return;
    }
    if (loginForm.password.length < 4) {
      setLoginError(t('errors.passwordTooShort'));
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginForm, email })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAuthToken(data.token);
      setCurrentAdmin(data.user ?? data);
      localStorage.setItem('handicare_auth_token', data.token);
      localStorage.setItem('handicare_auth_user', JSON.stringify(data.user ?? data));
    } catch {
      setLoginError(t('errors.invalidCredentials'));
    }
  };

  const logout = () => {
    clearAuthSession();
    setSection('home');
  };

  return (
    <div className={`${isHighContrast ? 'high-contrast' : ''} ${isLargeText ? 'large-text' : ''}`}>
      <header className="site-header">
        <button className="brand brand-button" onClick={() => setSection('home')} aria-label="HandiCare Maroc accueil">
          <img className="brand-logo" src="/assets/logo-handicare.png" alt="" />
          <span>HandiCare Maroc</span>
        </button>
        <nav aria-label="Navigation principale">
          <button className={section === 'home' ? 'active-nav' : ''} onClick={() => setSection('home')}>
            {t('navigation.home')}
          </button>
          <button className={section === 'map' ? 'active-nav' : ''} onClick={() => setSection('map')}>
            {t('navigation.map')}
          </button>

          <button className={section === 'resources' ? 'active-nav' : ''} onClick={() => setSection('resources')}>
            {t('navigation.resources')}
          </button>
          <button className={section === 'community' ? 'active-nav' : ''} onClick={() => setSection('community')}>
            <Users size={16} /> Communaute
          </button>
          <button className={section === 'chat' ? 'active-nav nav-badge-button' : 'nav-badge-button'} onClick={() => setSection('chat')}>
            <MessageCircle size={16} /> Chat
            {conversations.some(conversation => conversation.unread > 0) && (
              <span className="nav-badge">{conversations.reduce((sum, conversation) => sum + conversation.unread, 0)}</span>
            )}
          </button>
          <button className={section === 'notifications' ? 'active-nav nav-badge-button' : 'nav-badge-button'} onClick={() => setSection('notifications')} aria-label="Notifications">
            <Bell size={17} />
            <span className="nav-badge">{notifications.length}</span>
          </button>
          {currentAdmin?.accountType === 'ADMIN' && (
            <>
              <span className="nav-divider" />
              <span className="nav-group-label">{t('admin.title')}</span>
              <button className={section === 'admin' ? 'active-nav' : ''} onClick={() => setSection('admin')}>
                {t('admin.dashboard')}
              </button>
            </>
          )}
          {currentAdmin && <button onClick={logout}>{t('common.logout')}</button>}
        </nav>
        <select 
          className="language-select" 
          value={language} 
          onChange={(event) => setLanguage(event.target.value)} 
          aria-label="Language"
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="ar">AR</option>
        </select>
        <button className="icon-button" aria-label="Menu">
          <Menu size={20} />
        </button>
      </header>

      <main>
        {section === 'home' && (
          <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">HandiCare Maroc</p>
              <h1>{t('home.title')}</h1>
              <p>{t('home.subtitle')}</p>
              <p>{t('home.description')}</p>
              <div className="hero-highlights" aria-label={t('home.highlightsLabel')}>
                <span>{t('home.highlightMap')}</span>
                <span>{t('home.highlightVerified')}</span>
                <span>{t('home.highlightI18n')}</span>
              </div>
              <div className="hero-actions">
                <button className="primary-action" onClick={() => setSection('map')}>
                  <MapPin size={18} />
                  {t('home.exploreMap')}
                </button>
                <button className="secondary-action" onClick={() => setSection('resources')}>
                  <Search size={18} />
                  {t('home.viewResources')}
                </button>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-visual-card main">
                <Accessibility size={34} />
                <strong>{t('home.heroVisualTitle')}</strong>
                <span>{t('home.heroVisualText')}</span>
              </div>
              <div className="hero-visual-card stat one"><MapPin size={18} /><span>+120</span><small>{t('home.heroStatResources')}</small></div>
              <div className="hero-visual-card stat two"><ShieldCheck size={18} /><span>24/7</span><small>{t('home.heroStatAccess')}</small></div>
            </div>
            <div className="home-side-panel">
              {currentAdmin ? (
                <div className="auth-card">
                  <p className="eyebrow">{t('admin.connectedAs')}</p>
                  <h2>{currentAdmin.username ?? currentAdmin.email}</h2>
                  <p>{currentAdmin.role ?? currentAdmin.accountType}</p>
                  <button className="primary-action" style={{width:'100%'}} onClick={logout}>
                    {t('common.logout')}
                  </button>
                </div>
              ) : (
                <div className="auth-card">
                  <p className="eyebrow">HandiCare</p>
                  <h2>{authMode === 'login' ? t('auth.login') : t('auth.register')}</h2>
                  <div className="auth-tabs">
                    <button
                      className={authMode === 'login' ? 'active-nav' : ''}
                      onClick={() => { setAuthMode('login'); setLoginError(''); }}
                    >{t('auth.login')}</button>
                    <button
                      className={authMode === 'register' ? 'active-nav' : ''}
                      onClick={() => { setAuthMode('register'); setLoginError(''); }}
                    >{t('auth.register')}</button>
                  </div>
                  {authMode === 'login' ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                      <input
                        type="email"
                        placeholder={t('auth.email')}
                        value={loginForm.email}
                        onChange={e => setLoginForm(f => ({...f, email: e.target.value}))}
                        required
                      />
                      <div className="password-field">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          placeholder={t('auth.password')}
                          value={loginForm.password}
                          onChange={e => setLoginForm(f => ({...f, password: e.target.value}))}
                          required
                          minLength={4}
                        />
                        <button type="button" onClick={() => setShowLoginPassword(v => !v)} aria-label={showLoginPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
                          {showLoginPassword ? t('auth.hide') : t('auth.show')}
                        </button>
                      </div>
                      <button type="button" className="forgot-password" onClick={() => setLoginError(t('auth.forgotPasswordHelp'))}>{t('auth.forgotPassword')}</button>
                      {loginError && <p className="form-error">{loginError}</p>}
                      <button type="submit" className="primary-action">{t('auth.login')}</button>
                    </form>
                  ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                      <input type="text" placeholder={t('auth.fullName')} value={registerForm.fullName} onChange={e => setRegisterForm(f => ({...f, fullName: e.target.value}))} required />
                      <input type="email" placeholder={t('auth.email')} value={registerForm.email} onChange={e => setRegisterForm(f => ({...f, email: e.target.value}))} required dir="ltr" />
                      <input type="password" placeholder={t('auth.password')} value={registerForm.password} onChange={e => setRegisterForm(f => ({...f, password: e.target.value}))} required />
                      <input type="password" placeholder={t('auth.confirmPassword')} value={registerForm.confirmPassword} onChange={e => setRegisterForm(f => ({...f, confirmPassword: e.target.value}))} required />
                      <select value={registerForm.preferredNeed} onChange={e => setRegisterForm(f => ({...f, preferredNeed: e.target.value}))}>
                        <option value="motor">{t('needs.motor')}</option>
                        <option value="visual">{t('needs.visual')}</option>
                        <option value="hearing">{t('needs.hearing')}</option>
                        <option value="cognitive">{t('needs.cognitive')}</option>
                      </select>
                      {registerError && <p className="form-error">{registerError}</p>}
                      <button type="submit" className="primary-action">{t('auth.register')}</button>
                    </form>
                  )}
                </div>
              )}
              <div className="access-panel compact-access">
                <p className="eyebrow">{t('accessibility.accessibility')}</p>
                <button onClick={() => setIsHighContrast(v => !v)}>
                  <ShieldCheck size={16} />
                  {t('accessibility.highContrast')}
                </button>
                <button onClick={() => setIsLargeText(v => !v)}>
                  <Accessibility size={16} />
                  {t('accessibility.largeText')}
                </button>
              </div>
            </div>
          </section>
          <section className="association-cta-section">
            <div className="association-cta-card">
              <div>
                <p className="eyebrow">{t('assocRegister.eyebrow')}</p>
                <h2>{t('assocRegister.homeTitle')}</h2>
                <p>{t('assocRegister.homeDescription')}</p>
              </div>
              <button className="primary-action" onClick={() => setSection('assoc-register')}>
                <HeartHandshake size={18} />
                {t('assocRegister.navLabel')}
              </button>
            </div>
          </section>
          <section className="needs-section">
            <div className="section-heading">
              <h2>{t('home.features')}</h2>
            </div>
            <div className="needs-grid">
              <div className={`need-card${selectedNeed === 'motor' ? ' selected' : ''}`} onClick={() => { setSelectedNeed('motor'); setSection('map'); }}>
                <Accessibility size={28} />
                <span>{t('needs.motor')}</span>
                <small>{t('needs.motorDesc')}</small>
                <strong>→</strong>
              </div>
              <div className={`need-card${selectedNeed === 'visual' ? ' selected' : ''}`} onClick={() => { setSelectedNeed('visual'); setSection('map'); }}>
                <Eye size={28} />
                <span>{t('needs.visual')}</span>
                <small>{t('needs.visualDesc')}</small>
                <strong>→</strong>
              </div>
              <div className={`need-card${selectedNeed === 'hearing' ? ' selected' : ''}`} onClick={() => { setSelectedNeed('hearing'); setSection('map'); }}>
                <Ear size={28} />
                <span>{t('needs.hearing')}</span>
                <small>{t('needs.hearingDesc')}</small>
                <strong>→</strong>
              </div>
              <div className={`need-card${selectedNeed === 'cognitive' ? ' selected' : ''}`} onClick={() => { setSelectedNeed('cognitive'); setSection('map'); }}>
                <HeartHandshake size={28} />
                <span>{t('needs.cognitive')}</span>
                <small>{t('needs.cognitiveDesc')}</small>
                <strong>→</strong>
              </div>
            </div>
          </section>
          <section className="needs-section">
            <div className="section-heading">
              <h2>{t('resources.title')}</h2>
            </div>
            <div className="needs-grid">
              <div className="need-card" onClick={() => { setSelectedType('DOCTOR'); setSection('map'); }}>
                <Stethoscope size={28} />
                <span>{t('resources.doctors')}</span>
                <small>{t('resourceTypes.doctor')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('ASSOCIATION'); setSection('map'); }}>
                <HeartHandshake size={28} />
                <span>{t('resources.associations')}</span>
                <small>{t('resourceTypes.association')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('TRANSPORT'); setSection('map'); }}>
                <Navigation size={28} />
                <span>{t('resources.transport')}</span>
                <small>{t('resourceTypes.transport')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('REHABILITATION_CENTER'); setSection('map'); }}>
                <Building2 size={28} />
                <span>{t('resources.rehabilitations')}</span>
                <small>{t('resourceTypes.reeducation')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('EMERGENCY'); setSection('map'); }}>
                <Ambulance size={28} />
                <span>{t('resources.emergencies')}</span>
                <small>{t('resourceTypes.urgence')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('PHARMACY'); setSection('map'); }}>
                <Users size={28} />
                <span>{t('resources.pharmacies')}</span>
                <small>{t('resourceTypes.pharmacy')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('HOSPITAL'); setSection('map'); }}>
                <Building2 size={28} />
                <span>{t('resourceTypes.hospital')}</span>
                <small>{t('resourceTypes.hospital')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('CABINET'); setSection('map'); }}>
                <Stethoscope size={28} />
                <span>{t('resourceTypes.cabinet')}</span>
                <small>{t('resourceTypes.cabinet')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('EVENT'); setSection('map'); }}>
                <CalendarDays size={28} />
                <span>{t('resources.events')}</span>
                <small>{t('resourceTypes.event')}</small>
                <strong>→</strong>
              </div>
              <div className="need-card" onClick={() => { setSelectedType('ADMINISTRATIVE_SUPPORT'); setSection('map'); }}>
                <ClipboardList size={28} />
                <span>{t('resourceTypes.adminSupport')}</span>
                <small>{t('resourceTypes.adminSupport')}</small>
                <strong>→</strong>
              </div>
            </div>
          </section>
          </>
        )}
        
        {section === 'map' && (
          <section className="map-section">
            <div className="section-heading">
              <p className="eyebrow">{t('mapPage.supportMapFor')} {t(`needs.${selectedNeed}`).toLowerCase()}</p>
              <h1>{t('map.title')}</h1>
              <p>{t(`needs.${selectedNeed}Desc`)}</p>
            </div>
            {/* Filtres au-dessus de la carte */}
            <div className="map-tools-bar">
              <div className="map-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder={t('forms.searchByNameOrService')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                <option value="ALL">{t('map.filterByType')}</option>
                <option value="DOCTOR">{t('resourceTypes.doctor')}</option>
                <option value="ASSOCIATION">{t('resourceTypes.association')}</option>
                <option value="PHARMACY">{t('resourceTypes.pharmacy')}</option>
                <option value="REHABILITATION_CENTER">{t('resourceTypes.reeducation')}</option>
                <option value="HOSPITAL">{t('resourceTypes.hospital')}</option>
                <option value="CABINET">{t('resourceTypes.cabinet')}</option>
                <option value="TRANSPORT">{t('resourceTypes.transport')}</option>
                <option value="EMERGENCY">{t('resourceTypes.urgence')}</option>
                <option value="EVENT">{t('resourceTypes.event')}</option>
                <option value="ADMINISTRATIVE_SUPPORT">{t('resourceTypes.adminSupport')}</option>
              </select>
              <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                <option value="all">{t('forms.allDistricts')}</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                {sortOptions.map(option => <option key={option.value} value={option.value}>Trier par : {option.label}</option>)}
              </select>
            </div>
            <div className="map-layout">
              {/* Liste des ressources à gauche */}
              <div className="resource-panel">
                <div className="resource-list">
                  {sortResources(resources
                    .filter(r => selectedType === 'ALL' || r.type === selectedType)
                    .filter(r => resourceMatchesNeed(r, selectedNeed))
                    .filter(r => selectedDistrict === 'all' || r.district === selectedDistrict || (r.address ?? '').toLowerCase().includes(selectedDistrict.toLowerCase().replace('-', ' ')))
                    .filter(r => !query || r.name.toLowerCase().includes(query.toLowerCase()) || (r.description ?? '').toLowerCase().includes(query.toLowerCase())), selectedSort)
                    .map(resource => (
                      <div key={resource.id} className="resource-card">
                        <div className="resource-card-header">
                          <span className="type-pill" style={{background: TYPE_COLORS[resource.type] ?? '#116a64'}}>{(TYPE_LABELS[resource.type])?.[language] ?? resource.type}</span>
                          {resource.verified && <span className="verified"><ShieldCheck size={12} />{t('forms.verified')}</span>}
                        </div>
                        <h3>{resource.name}</h3>
                        <p>{resource.description}</p>
                        <ResourceMetricStrip resource={resource} />
                        <dl>
                          <dt><MapPin size={13} /> {t('resources.address')}</dt>
                          <dd>{resource.address}</dd>
                          {resource.phone && <><dt><Phone size={13} /> {t('resources.phone')}</dt>
                          <dd><a href={`tel:${resource.phone}`} dir="ltr" className="phone-number">{resource.phone}</a></dd></>}
                          {(resource.hours ?? resource.openingHours) && <><dt><CalendarDays size={13} /> {t('resources.hours')}</dt>
                          <dd>{resource.hours ?? resource.openingHours}</dd></>}
                        </dl>
                        <div className="contact-actions">
                          <a href={getLocationUrl(resource)} target="_blank" rel="noopener noreferrer">
                            <MapPin size={14} />{t('reviews.voir_localisation')}
                          </a>
                          {(getResourceLat(resource) != null && getResourceLng(resource) != null) && (
                            <a href={getDirectionsUrl(resource)} target="_blank" rel="noopener noreferrer">
                              <Navigation size={14} />{t('reviews.ouvrir_itineraire')}
                            </a>
                          )}
                        </div>
                        <ResourceReviews resource={resource} authToken={authToken} currentAccount={currentAdmin} onAuthExpired={clearAuthSession} t={t} />
                      </div>
                    ))}
                  {resources.filter(r =>
                    (selectedType === 'ALL' || r.type === selectedType) &&
                    resourceMatchesNeed(r, selectedNeed) &&
                    (selectedDistrict === 'all' || r.district === selectedDistrict || (r.address ?? '').toLowerCase().includes(selectedDistrict.toLowerCase().replace('-', ' '))) &&
                    (!query || r.name.toLowerCase().includes(query.toLowerCase()) || (r.description ?? '').toLowerCase().includes(query.toLowerCase()))
                  ).length === 0 && (
                    <div className="empty-state"><p>{t('map.noResults')}</p></div>
                  )}
                </div>
              </div>
              {/* Carte Leaflet à droite */}
              <div style={{width:'520px', flexShrink:0}}>
                <LeafletMap
                  resources={resources}
                  selectedType={selectedType}
                  selectedDistrict={selectedDistrict}
                  selectedNeed={selectedNeed}
                  query={query}
                  language={language}
                />
              </div>
            </div>
          </section>
        )}
        
        {section === 'assoc-register' && (
          <section className="association-signup">
            <div className="section-heading">
              <p className="eyebrow">HandiCare Maroc</p>
              <h1>{t('assocRegister.title')}</h1>
              <p>{t('assocRegister.subtitle')}</p>
            </div>
            {assocSuccess ? (
              <div className="form-success">
                <h2>{t('assocRegister.successTitle')}</h2>
                <p>{t('assocRegister.successMsg')}</p>
                <p style={{fontSize:'0.9rem',color:'var(--muted)'}}>{t('forms.informationPending')}</p>
              </div>
            ) : (
              <form className="association-form" onSubmit={handleAssocRegister}>
                <input required placeholder={t('forms.associationName')} value={assocForm.associationName} onChange={e => setAssocForm(f => ({...f, associationName: e.target.value}))} />
                <input required type="email" placeholder={t('forms.associationEmail')} value={assocForm.email} onChange={e => setAssocForm(f => ({...f, email: e.target.value}))} dir="ltr" />
                <input required type="password" placeholder={t('forms.associationPassword')} value={assocForm.passwordHash} onChange={e => setAssocForm(f => ({...f, passwordHash: e.target.value}))} />
                <input required type="password" placeholder={t('auth.confirmPassword')} value={assocForm.confirmPassword} onChange={e => setAssocForm(f => ({...f, confirmPassword: e.target.value}))} />
                <input placeholder={t('forms.contactPerson')} value={assocForm.contactPerson} onChange={e => setAssocForm(f => ({...f, contactPerson: e.target.value}))} />
                <input placeholder={t('forms.publicPhone')} value={assocForm.phone} onChange={e => setAssocForm(f => ({...f, phone: e.target.value}))} dir="ltr" />
                <input placeholder={t('forms.address')} value={assocForm.address} onChange={e => setAssocForm(f => ({...f, address: e.target.value}))} style={{gridColumn:'span 2'}} />
                {/* Coordonnées GPS avec carte de prévisualisation */}
                <div style={{gridColumn:'1/-1', background:'var(--soft)', borderRadius:'8px', padding:'1rem', display:'grid', gap:'0.75rem'}}>
                  <p style={{margin:0, fontWeight:800, fontSize:'0.9rem'}}>
                    📍 {t('forms.latitude')} / {t('forms.longitude')} —{' '}
                    <a
                      href="https://www.openstreetmap.org/#map=13/33.5731/-7.5898"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{color:'var(--primary)', fontWeight:700}}
                    >
                      Ouvrir OpenStreetMap →
                    </a>
                    <span style={{color:'var(--muted)', fontWeight:400, fontSize:'0.82rem', display:'block', marginTop:'0.25rem'}}>
                      Cliquez sur votre emplacement sur la carte, puis copiez les coordonnées depuis l'URL (ex: #map=17/<strong>33.5861</strong>/<strong>-7.6358</strong>)
                    </span>
                  </p>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem'}}>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]+[.,][0-9]+"
                      required
                      placeholder={t('forms.latitude') + ' (ex: 33.5861)'}
                      value={assocForm.latitude}
                      onChange={e => setAssocForm(f => ({...f, latitude: e.target.value.replace(',', '.')}))}
                      dir="ltr"
                      className="ltr-data"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="-?[0-9]+[.,][0-9]+"
                      required
                      placeholder={t('forms.longitude') + ' (ex: -7.6358)'}
                      value={assocForm.longitude}
                      onChange={e => setAssocForm(f => ({...f, longitude: e.target.value.replace(',', '.')}))}
                      dir="ltr"
                      className="ltr-data"
                    />
                  </div>
                  {assocForm.latitude && assocForm.longitude && (
                    <div style={{borderRadius:'6px', overflow:'hidden', height:'200px', position:'relative'}}>
                      <iframe
                        title="Prévisualisation position"
                        style={{width:'100%', height:'100%', border:0}}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(assocForm.longitude)-0.01}%2C${parseFloat(assocForm.latitude)-0.007}%2C${parseFloat(assocForm.longitude)+0.01}%2C${parseFloat(assocForm.latitude)+0.007}&layer=mapnik&marker=${assocForm.latitude}%2C${assocForm.longitude}`}
                      />
                      <div style={{position:'absolute', bottom:'0.5rem', left:'0.5rem', background:'white', borderRadius:'4px', padding:'0.25rem 0.5rem', fontSize:'0.78rem', color:'var(--ink)', fontFamily:'monospace', direction:'ltr'}}>
                        {parseFloat(assocForm.latitude).toFixed(4)}, {parseFloat(assocForm.longitude).toFixed(4)}
                      </div>
                    </div>
                  )}
                </div>
                <textarea placeholder={t('forms.servicesProvided')} value={assocForm.services} onChange={e => setAssocForm(f => ({...f, services: e.target.value}))} />
                <textarea placeholder={t('forms.shortDescription')} value={assocForm.description} onChange={e => setAssocForm(f => ({...f, description: e.target.value}))} />
                {/* Types de handicap pris en charge */}
                <div style={{gridColumn:'1/-1'}}>
                  <p style={{margin:'0 0 0.5rem', fontWeight:700, fontSize:'0.88rem'}}>{t('forms.disabilityTypesSupported')}</p>
                  <div className="needs-checkboxes" style={{margin:0}}>
                    {needs.map(need => {
                      const keys = (assocForm.disabilityKeys ?? '').split(',').map(k => k.trim()).filter(Boolean);
                      const checked = keys.includes(need);
                      return (
                        <label key={need} className={`need-checkbox${checked ? ' checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? keys.filter(k => k !== need)
                                : [...keys, need];
                              setAssocForm(f => ({...f, disabilityKeys: next.join(',')}));
                            }}
                          />
                          {t(`needs.${need}`)}
                        </label>
                      );
                    })}
                  </div>
                </div>
                {assocError && <p className="form-error" style={{gridColumn:'1/-1'}}>{assocError}</p>}
                <button type="submit" className="primary-action" style={{gridColumn:'1/-1'}}>
                  <Plus size={16} />{t('forms.submitForVerification')}
                </button>
                <p style={{gridColumn:'1/-1', color:'var(--muted)', fontSize:'0.88rem'}}>{t('forms.informationPending')}</p>
              </form>
            )}
          </section>
        )}

        {section === 'admin' && currentAdmin?.accountType === 'ADMIN' && (
          <AdminDashboard authToken={authToken} t={t} language={language} />
        )}

        {section === 'community' && (
          <CommunityPage
            posts={communityPosts}
            setPosts={setCommunityPosts}
            joinedGroups={joinedGroups}
            setJoinedGroups={setJoinedGroups}
          />
        )}

        {section === 'chat' && (
          <ChatPage conversations={conversations} setConversations={setConversations} />
        )}

        {section === 'notifications' && (
          <NotificationsPage notifications={notifications} />
        )}

        {section === 'resources' && (
          <section className="resources-section">
            <div className="section-heading">
              <h1>{t('resources.title')}</h1>
            </div>

            {/* Barre de recherche + filtres type/district */}
            <div className="map-tools-bar" style={{marginBottom:'0.75rem'}}>
              <div className="map-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder={t('forms.searchByNameOrService')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="filter-select">
                <option value="ALL">{t('map.filterByType')}</option>
                <option value="DOCTOR">{t('resourceTypes.doctor')}</option>
                <option value="ASSOCIATION">{t('resourceTypes.association')}</option>
                <option value="PHARMACY">{t('resourceTypes.pharmacy')}</option>
                <option value="HOSPITAL">{t('resourceTypes.hospital')}</option>
                <option value="CABINET">{t('resourceTypes.cabinet')}</option>
                <option value="TRANSPORT">{t('resourceTypes.transport')}</option>
                <option value="REHABILITATION_CENTER">{t('resourceTypes.reeducation')}</option>
                <option value="EMERGENCY">{t('resourceTypes.urgence')}</option>
                <option value="EVENT">{t('resourceTypes.event')}</option>
                <option value="ADMINISTRATIVE_SUPPORT">{t('resourceTypes.adminSupport')}</option>
              </select>
              <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="filter-select">
                <option value="all">{t('forms.allDistricts')}</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)} className="filter-select">
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>Trier par : {option.label}</option>
                ))}
              </select>
            </div>

            {/* Checkboxes handicap */}
            <div className="needs-checkboxes">
              <span className="needs-checkboxes-label">{t('resources.filterByNeed')}</span>
              {needs.map(need => (
                <label key={need} className={`need-checkbox${selectedNeeds.includes(need) ? ' checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedNeeds.includes(need)}
                    onChange={() => toggleNeed(need)}
                  />
                  {t(`needs.${need}`)}
                </label>
              ))}
              {selectedNeeds.length > 0 && (
                <button className="clear-needs-btn" onClick={() => setSelectedNeeds([])}>
                  ✕ {t('resources.clearFilters')}
                </button>
              )}
            </div>

            {/* Liste des ressources */}
            <div className="resources-list">
              {(() => {
                const filtered = sortResources(resources
                  .filter(r => selectedType === 'ALL' || r.type === selectedType)
                  .filter(r => selectedDistrict === 'all' || (r.district === selectedDistrict) || (r.address ?? '').toLowerCase().includes(selectedDistrict.toLowerCase().replace('-', ' ')))
                  .filter(r => !query || r.name.toLowerCase().includes(query.toLowerCase()) || (r.description ?? '').toLowerCase().includes(query.toLowerCase()))
                  .filter(r => selectedNeeds.length === 0 || selectedNeeds.some(n => (r.disabilityKeys ?? '').toLowerCase().includes(n))), selectedSort);

                if (filtered.length === 0) return (
                  <div className="empty-state"><p>{t('resources.noResources')}</p></div>
                );

                return filtered.map(resource => (
                  <div key={resource.id} className="resource-card">
                    <div className="resource-card-header">
                      <div style={{display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap'}}>
                        <span className="type-pill" style={{background: TYPE_COLORS[resource.type] ?? '#116a64'}}>
                          {(TYPE_LABELS[resource.type])?.[language] ?? resource.type}
                        </span>
                        {resource.verified && (
                          <span className="verified"><ShieldCheck size={12} />{t('forms.verified')}</span>
                        )}
                      </div>
                      <button
                        className="map-link-btn"
                        onClick={() => goToResource(resource)}
                        title={t('resources.viewOnMap')}
                      >
                        <MapPin size={14} /> {t('resources.viewOnMap')}
                      </button>
                    </div>

                    <h3 style={{margin:'0.5rem 0 0.25rem', fontSize:'1.05rem'}}>{resource.name}</h3>
                    {resource.description && (
                      <p className="resource-description">{resource.description}</p>
                    )}
                    <ResourceMetricStrip resource={resource} />

                    <div className="resource-details">
                      {resource.address && (
                        <div className="detail-item">
                          <MapPin size={15} />
                          <span>{resource.address}</span>
                        </div>
                      )}
                      {resource.phone && (
                        <div className="detail-item">
                          <Phone size={15} />
                          <a href={`tel:${resource.phone}`} dir="ltr" className="phone-number">{resource.phone}</a>
                        </div>
                      )}
                      {resource.email && (
                        <div className="detail-item">
                          <MessageCircle size={15} />
                          <a href={`mailto:${resource.email}`} dir="ltr" className="ltr-data">{resource.email}</a>
                        </div>
                      )}
                      {(resource.hours ?? resource.openingHours) && (
                        <div className="detail-item">
                          <CalendarDays size={15} />
                          <span>{resource.hours ?? resource.openingHours}</span>
                        </div>
                      )}
                      {resource.disabilityKeys && (
                        <div className="detail-item" style={{flexWrap:'wrap', gap:'0.3rem'}}>
                          {resource.disabilityKeys.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                            <span key={k} className="need-tag">{t(`needs.${k}`, k)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="contact-actions">
                      <a href={getLocationUrl(resource)} target="_blank" rel="noopener noreferrer">
                        <MapPin size={14} />{t('reviews.voir_localisation')}
                      </a>
                      {(getResourceLat(resource) != null && getResourceLng(resource) != null) && (
                        <a href={getDirectionsUrl(resource)} target="_blank" rel="noopener noreferrer">
                          <Navigation size={14} />{t('reviews.ouvrir_itineraire')}
                        </a>
                      )}
                    </div>
                    <ResourceReviews resource={resource} authToken={authToken} currentAccount={currentAdmin} onAuthExpired={clearAuthSession} t={t} />
                  </div>
                ));
              })()}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
