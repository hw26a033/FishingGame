/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  Gamepad2, 
  Timer, 
  CheckCircle2, 
  ChevronRight, 
  Keyboard, 
  RotateCcw, 
  Anchor,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  Info,
  Flame,
  Award,
  BookMarked,
  Sparkles,
  Waves,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Level types
type Level = 'easy' | 'medium' | 'hard' | 'expert';

interface Fish {
  kanji: string;
  reading: string;
  roman: string; // The exact expected typing string
  meaning: string;
  origin: string; // trivia about kanji origin
  shapeType: 'tuna' | 'flat' | 'shark' | 'shell' | 'shrimp' | 'round' | 'octopus';
}

const ROMAN_MAP: Record<string, string[]> = {
  'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
  'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
  'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
  'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'わ': ['wa'], 'を': ['wo', 'o'], 'ん': ['n', 'nn'],
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'だ': ['da'], 'ぢ': ['di', 'ji'], 'づ': ['du', 'zu'], 'で': ['de'], 'ど': ['do'],
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
  'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
  'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
  'ちゃ': ['cha', 'tya'], 'ちゅ': ['chu', 'tyu'], 'ちょ': ['cho', 'tyo'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['ja', 'zya', 'jya'], 'じゅ': ['ju', 'zyu', 'jyu'], 'じょ': ['jo', 'zyo', 'jyo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
};

// Generate all possible valid roman typings for a given hiragana string.
function generateRomanOptions(kana: string): string[] {
  const results: string[] = [];
  
  function recurse(index: number, current: string) {
    if (index >= kana.length) {
      results.push(current);
      return;
    }
    
    // Check 2 characters (diphthongs like "しゃ", "ぎょ")
    if (index + 1 < kana.length) {
      const doubleChar = kana.substring(index, index + 2);
      if (ROMAN_MAP[doubleChar]) {
        for (const r of ROMAN_MAP[doubleChar]) {
          recurse(index + 2, current + r);
        }
      }
    }
    
    // Check 1 character
    const singleChar = kana[index];
    if (ROMAN_MAP[singleChar]) {
      for (const r of ROMAN_MAP[singleChar]) {
        recurse(index + 1, current + r);
      }
    } else {
      // Pass-through any other chars
      recurse(index + 1, current + singleChar);
    }
  }
  
  recurse(0, '');
  return Array.from(new Set(results)).filter(Boolean);
}

// Fisher-Yates Shuffle Algorithm for complete randomization of fish pool
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ユーザー提供のロゴデザイン「うお！タイピングマスター」を再現した高品質SVGコンポーネント
export function TitleLogo({ className = "h-12" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 400 180" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 水色〜シアン〜青のグラデーション */}
        <linearGradient id="fishGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* 鱗（うろこ）テクスチャパターン */}
        <pattern id="scalesPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 0,10 A 10,10 0 0,0 20,10 A 10,10 0 0,0 0,10 Z" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.35" />
          <path d="M 10,20 A 10,10 0 0,0 30,20 A 10,10 0 0,0 10,20 Z" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.35" />
        </pattern>
        
        {/* 黒フチ用シャドウ */}
        <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 影と立体感のオフセット用（オレンジ色の3D立体シャドウ） */}
      <g transform="translate(4, 5)" opacity="0.9">
        <text 
          x="200" 
          y="75" 
          textAnchor="middle" 
          fontSize="68" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          stroke="#f97316" 
          strokeWidth="16" 
          strokeLinejoin="round"
        >
          うお！
        </text>
        <text 
          x="200" 
          y="130" 
          textAnchor="middle" 
          fontSize="36" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          stroke="#f97316" 
          strokeWidth="12" 
          strokeLinejoin="round"
          transform="rotate(-4, 200, 120)"
        >
          タイピングマスター
        </text>
      </g>

      {/* メインロゴテキスト：うお！ */}
      <g>
        <text 
          x="200" 
          y="75" 
          textAnchor="middle" 
          fontSize="68" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          stroke="#000000" 
          strokeWidth="14" 
          strokeLinejoin="round"
          filter="url(#shadow)"
        >
          うお！
        </text>
        <text 
          x="200" 
          y="75" 
          textAnchor="middle" 
          fontSize="68" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          stroke="#ffffff" 
          strokeWidth="6" 
          strokeLinejoin="round"
        >
          うお！
        </text>
        <text 
          x="200" 
          y="75" 
          textAnchor="middle" 
          fontSize="68" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="url(#fishGrad)"
        >
          うお！
        </text>
        <text 
          x="200" 
          y="75" 
          textAnchor="middle" 
          fontSize="68" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="url(#scalesPattern)"
          opacity="0.9"
        >
          うお！
        </text>
      </g>

      {/* メインロゴテキスト：タイピングマスター (少し右上がりに傾ける) */}
      <g transform="rotate(-4, 200, 120)">
        <text 
          x="200" 
          y="130" 
          textAnchor="middle" 
          fontSize="36" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          stroke="#000000" 
          strokeWidth="10" 
          strokeLinejoin="round"
          filter="url(#shadow)"
        >
          タイピングマスター
        </text>
        <text 
          x="200" 
          y="130" 
          textAnchor="middle" 
          fontSize="36" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          stroke="#ffffff" 
          strokeWidth="4" 
          strokeLinejoin="round"
        >
          タイピングマスター
        </text>
        <text 
          x="200" 
          y="130" 
          textAnchor="middle" 
          fontSize="36" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="url(#fishGrad)"
        >
          タイピングマスター
        </text>
        <text 
          x="200" 
          y="130" 
          textAnchor="middle" 
          fontSize="36" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="url(#scalesPattern)"
          opacity="0.9"
        >
          タイピングマスター
        </text>
      </g>

      {/* サブタイトル英語：UO! TYPING MASTER */}
      <g>
        <text 
          x="200" 
          y="165" 
          textAnchor="middle" 
          fontSize="14" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          stroke="#000000" 
          strokeWidth="4" 
          strokeLinejoin="round"
          letterSpacing="1"
        >
          UO! TYPING MASTER
        </text>
        <text 
          x="200" 
          y="165" 
          textAnchor="middle" 
          fontSize="14" 
          fontWeight="900" 
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#ffffff"
          letterSpacing="1"
        >
          UO! TYPING MASTER
        </text>
      </g>
    </svg>
  );
}

// Web Audio API helper for custom sound effects
let globalAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
};

const playWrongSound = (isMuted: boolean) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Failed to play wrong sound:", e);
  }
};

const playCatchSound = (isMuted: boolean) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // C Major Arpeggio for a happy, crisp catch sound
    const cMajorNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    cMajorNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      
      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  } catch (e) {
    console.warn("Failed to play catch sound:", e);
  }
};

export default function App() {
  // App view modes: 'game' or 'spec'
  const [appMode, setAppMode] = useState<'game' | 'spec'>('game');
  
  // Game state
  const [gameState, setGameState] = useState<'title' | 'preview-list' | 'playing' | 'result'>('title');
  const [selectedLevel, setSelectedLevel] = useState<Level>('easy');
  const [highScores, setHighScores] = useState<Record<Level, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0
  });
  
  // Sound toggle state (visual simulation)
  const [isMuted, setIsMuted] = useState(false);

  // Furigana showing/hidden option (educational config)
  const [showFurigana, setShowFurigana] = useState<boolean>(true);

  // Load Highscores from localStorage
  useEffect(() => {
    try {
      const savedScores = localStorage.getItem('fish_kanji_high_scores');
      if (savedScores) {
        setHighScores(JSON.parse(savedScores));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Reset all high scores
  const resetHighScores = () => {
    const defaultScores = {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0
    };
    setHighScores(defaultScores);
    localStorage.setItem('fish_kanji_high_scores', JSON.stringify(defaultScores));
  };

  // Complete Fish Database
  const fishDatabase: Record<'easy' | 'medium' | 'hard', Fish[]> = {
    easy: [
      { kanji: '鮪', reading: 'まぐろ', roman: 'maguro', meaning: 'マグロ', origin: '「有」は丸く囲む意味を持ち、広大な海を群れを成して回遊し続ける魚を表します。', shapeType: 'tuna' },
      { kanji: '鮭', reading: 'さけ', roman: 'sake', meaning: 'サケ', origin: '「圭」には三角にとがった形の土器の意味があり、産卵期に鼻先が尖るサケの特徴から来ています。', shapeType: 'tuna' },
      { kanji: '鯛', reading: 'たい', roman: 'tai', meaning: 'タイ', origin: '「周」は平らで万遍なく行き届く意味があり、体が平たくて日本中どこでも獲れる平らな魚を表します。', shapeType: 'round' },
      { kanji: '鰯', reading: 'いわし', roman: 'iwashi', meaning: 'イワシ', origin: '陸に上げるとすぐに弱って死んでしまう弱い魚であることから「魚に弱」と書きます。', shapeType: 'tuna' },
      { kanji: '蛸', reading: 'たこ', roman: 'tako', meaning: 'タコ', origin: '「肖」には体が細くクネクネしている様子があり、8本の腕でくねくね動くタコを表現しています。', shapeType: 'octopus' },
      { kanji: '鱈', reading: 'たら', roman: 'tara', meaning: 'タラ', origin: '身が雪のように真っ白であること、また初冬の初雪が降る時期に最もよく獲れる魚だから。', shapeType: 'tuna' },
      { kanji: '鮎', reading: 'あゆ', roman: 'ayu', meaning: 'アユ', origin: '自分のなわばりを占有する（占める）強い習性がある川魚であることから「魚に占」と書きます。', shapeType: 'tuna' },
      { kanji: '鯉', reading: 'こい', roman: 'koi', meaning: 'コイ', origin: '「里」には「筋目・整然とした鱗」という意味があり、鱗が非常に美しく整っている淡水魚を意味します。', shapeType: 'round' },
      { kanji: '鰻', reading: 'うなぎ', roman: 'unagi', meaning: 'ウナギ', origin: '「曼」は長く伸びる、長く連なるという意味。細長くてどこまでも伸びるような体型から。', shapeType: 'round' },
      { kanji: '鮫', reading: 'さめ', roman: 'same', meaning: 'サメ', origin: '「交」は交わる、または交差する鋭い歯。サメが交尾をする特異な魚類である説もあります。', shapeType: 'shark' },
      { kanji: '貝', reading: 'かい', roman: 'kai', meaning: 'カイ', origin: '魚偏ではないものの、古代より財貨や美しい装飾品として重宝された、殻を持つ水生生物。', shapeType: 'shell' },
      { kanji: '鰊', reading: 'にしん', roman: 'nishin', meaning: 'ニシン', origin: '「東側の温かい海でとれる」意味があり、春先に産卵のために群れでやってくる春告魚。', shapeType: 'tuna' },
      { kanji: '鯖', reading: 'さば', roman: 'saba', meaning: 'サバ', origin: '「青」は澄んだ青色のこと。背が青く光っているサバの美しい魚体を表しています。', shapeType: 'tuna' },
      { kanji: '鰹', reading: 'かつお', roman: 'katsuo', meaning: 'カツオ', origin: '「堅」は身が硬いこと。乾燥させると非常に硬い鰹節になる、強靭な身を持つ魚です。', shapeType: 'tuna' },
      { kanji: '鯔', reading: 'ぼら', roman: 'bora', meaning: 'ボラ', origin: '「甾」は脂が詰まった壺。非常に脂がのっており、古来から珍重されてきた汽水域の魚。', shapeType: 'tuna' },
      { kanji: '鯏', reading: 'あさり', roman: 'asari', meaning: 'アサリ', origin: '「利」には砂を掘るなどの意味があり、浅瀬の砂地に生息して簡単に掘り出せる貝を意味します。', shapeType: 'shell' },
      { kanji: '鱒', reading: 'ます', roman: 'masu', meaning: 'マス', origin: 'サケに似た美しい淡水魚。非常に清らかな川に生息し、川の「尊い」女王として親しまれます。', shapeType: 'tuna' },
      { kanji: '鮒', reading: 'ふな', roman: 'funa', meaning: 'フナ', origin: '「付」は身近に付き添う。昔から水田や池、小川など人の生活のすぐそばにいる日本でおなじみの淡水魚。', shapeType: 'round' },
      { kanji: '鰡', reading: 'ぼら', roman: 'bora', meaning: 'ボラ', origin: '「留」は留まる。汽水域に多く生息し、成長につれて「イナ」「ボラ」「トド」と名前が変わる代表的な出世魚。', shapeType: 'tuna' },
      { kanji: '蜆', reading: 'しじみ', roman: 'shijimi', meaning: 'シジミ', origin: '「見」は現れる。砂地や泥から頭をのぞかせる、味噌汁の具として古くから親しまれる小さな二枚貝。', shapeType: 'shell' }
    ],
    medium: [
      { kanji: '鰆', reading: 'さわら', roman: 'sawara', meaning: 'サワラ', origin: '春に産卵期を迎え、瀬戸内海などに押し寄せてよく獲れるため「魚に春」と書きます。', shapeType: 'tuna' },
      { kanji: '鰺', reading: 'あじ', roman: 'aji', meaning: 'アジ', origin: '「参」には美味しくて「ただただ参ってしまう」ほど、非常に味わい深い魚という意味があります。', shapeType: 'tuna' },
      { kanji: '鰈', reading: 'かれい', roman: 'karei', meaning: 'カレイ', origin: '「葉」のように体が薄く平らな魚。右側に目があるのが特徴です。', shapeType: 'flat' },
      { kanji: '鰤', reading: 'ぶり', roman: 'buri', meaning: 'ブリ', origin: '師走（12月）の寒冷期に脂が最も乗り、絶品になる魚であることから「魚に師」。', shapeType: 'tuna' },
      { kanji: '鮃', reading: 'ひらめ', roman: 'hirame', meaning: 'ヒラメ', origin: '「平」が示す通り、海底の砂に擬態して暮らす非常に「平ら」な魚。左側に目があります。', shapeType: 'flat' },
      { kanji: '鮑', reading: 'あわび', roman: 'awabi', meaning: 'アワビ', origin: '「包」は殻の中に肉が包まれている様子。古来より贈り物として包まれた高級貝。', shapeType: 'shell' },
      { kanji: '鯑', reading: 'かずのこ', roman: 'kazunoko', meaning: 'カズノコ', origin: '「希」にはめったにない、黄色い輝き、美しい卵の意味があり、子孫繁栄を象徴するニシンの卵。', shapeType: 'shell' },
      { kanji: '鮴', reading: 'めばる', roman: 'mebaru', meaning: 'メバル', origin: '「休」は留まること。岩陰にじっと静止して休んでいるかのように獲物を待つ習性から。', shapeType: 'round' },
      { kanji: '鱪', reading: 'しいら', roman: 'shiira', meaning: 'シイラ', origin: '「暑」の漢字が示すように、ハワイや日本の南国など、夏の暑い海を回遊する大型魚。', shapeType: 'tuna' },
      { kanji: '鱚', reading: 'きす', roman: 'kisu', meaning: 'キス', origin: '「喜」は澄み切った、嬉しい。白砂の浅瀬を上品に群れ泳ぐ、大変美しい白身の魚。', shapeType: 'tuna' },
      { kanji: '鰌', reading: 'どじょう', roman: 'dojou', meaning: 'ドジョウ', origin: '「尊」は身が細く、うねる様子。泥の中に生息し、細長くクネクネと動く滋養強壮に優れた淡水魚。', shapeType: 'round' },
      { kanji: '鰍', reading: 'かじか', roman: 'kajika', meaning: 'カジカ', origin: '「秋」は秋の風物詩。川底に潜み、美しい鳴き声（古くはカエルのように鳴くとされた）を持つとされる川魚。', shapeType: 'tuna' },
      { kanji: '鯏', reading: 'うぐい', roman: 'ugui', meaning: 'ウグイ', origin: '「利」は鋭い、すばしっこい。日本中の河川に広く生息し、繁殖期には鮮やかな赤い婚姻色を見せる淡水魚。', shapeType: 'tuna' },
      { kanji: '鯔', reading: 'いな', roman: 'ina', meaning: 'イナ', origin: 'ボラの若魚。「甾」は丸みがある様子。江戸時代から出世魚として親しまれた中堅サイズのボラ。', shapeType: 'tuna' },
      { kanji: '鱠', reading: 'なます', roman: 'namasu', meaning: 'ナマス', origin: '「会」は細かく切る、集める。魚の肉を細切りにして酢で和えた、日本伝統 of 美しい魚料理。', shapeType: 'round' },
      { kanji: '鰏', reading: 'ひいらぎ', roman: 'hiiragi', meaning: 'ヒイラギ', origin: '「逼」は狭い、平たい。木の葉のように平たい円形の極小魚で、背びれのトゲが鋭く光るのが特徴。', shapeType: 'flat' },
      { kanji: '鯧', reading: 'まなかつお', roman: 'manakatsuo', meaning: 'マナカツオ', origin: '「昌」は美しい、盛ん。西日本で最高級魚とされ、平たくて美しい円盤のような魚体を持つ。', shapeType: 'flat' },
      { kanji: '鯳', reading: 'すけとうだら', roman: 'suketoudara', meaning: 'スケトウダラ', origin: '「底」は深いところ。タラコの親。北の冷たい深海に群れて生息するタラ科の主要な白身魚。', shapeType: 'tuna' }
    ],
    hard: [
      { kanji: '鯒', reading: 'こち', roman: 'kochi', meaning: 'コチ', origin: '「甬」は縦に通る、まっすぐ。頭が非常に平たく角張っており、這うように泳ぐ高級底生魚。', shapeType: 'flat' },
      { kanji: '鱘', reading: 'ちょうざめ', roman: 'chouzame', meaning: 'チョウザメ', origin: '「尋」は極めて長い。川を遡上する巨大な古代魚で、ウロコが蝶の羽に似ている。', shapeType: 'shark' },
      { kanji: '魴', reading: 'かがみだい', roman: 'kagamidai', meaning: 'カガミダイ', origin: '「方」は方角、四角。鏡のように平たい銀色の魚体だから。', shapeType: 'flat' },
      { kanji: '鰦', reading: 'ます', roman: 'masu', meaning: 'マス', origin: '「茲」は生い茂る、増える。渓流や河川に溢れんばかりに群生するサケ科の淡水魚。', shapeType: 'tuna' },
      { kanji: '鯐', reading: 'すばしり', roman: 'subashiri', meaning: 'スバシリ', origin: 'ボラの幼魚。水面を俊敏に「素早く走る」様子からこの漢字が当てられました。', shapeType: 'tuna' },
      { kanji: '鱸', reading: 'すずき', roman: 'suzuki', meaning: 'スズキ', origin: '「盧」は黒い、または斑点のある様子。成長するにつれて名前が変わる代表的な出世魚。', shapeType: 'tuna' },
      { kanji: '鮴', reading: 'ごり', roman: 'gori', meaning: 'ゴリ', origin: '「休」は底に留まること。川底の石の隙間にピタッと張り付いてじっとしている小さくたくましい底生魚。', shapeType: 'round' },
      { kanji: '鮟', reading: 'あんこう', roman: 'ankou', meaning: 'アンコウ', origin: '「安」は平らでどっしり落ち着いている様子。海底に平らになり砂に潜んで獲物をじっと待つ奇怪な深海魚。', shapeType: 'round' },
      { kanji: '鱖', reading: 'けつぎょ', roman: 'ketsugyo', meaning: 'ケツギョ', origin: '「厥」は飛び跳ねる、尖る。背びれに鋭い毒棘を持ち、山水画にも描かれる中国の代表的な肉食性淡水魚。', shapeType: 'tuna' },
      { kanji: '鱧', reading: 'はも', roman: 'hamo', meaning: 'ハモ', origin: '「豊」は生命力が極めて豊か、または鋭い歯が豊かに並ぶこと。驚異的な生命力を持ち、夏の京都で愛される高級魚。', shapeType: 'round' },
      { kanji: '鰣', reading: 'ひら', roman: 'hira', meaning: 'ヒラ', origin: '「時」は季節、時を告げる。特定の季節（春から初夏）に産卵のため決まった川や沿岸にやってくるニシン科の魚。', shapeType: 'tuna' },
      { kanji: '鰾', reading: 'うきぶくろ', roman: 'ukibukuro', meaning: 'ウキブクロ', origin: '「票」は浮く。魚が水中での浮力を調節するための、ガスが詰まった重要な気嚢（きのう）器官。', shapeType: 'round' },
      { kanji: '鱵', reading: 'さより', roman: 'sayori', meaning: 'サヨリ', origin: '「箴」は細い針。下顎が針のように長く伸びた、極めてスマートな美しいシルエットの高級魚。', shapeType: 'tuna' }
    ]
  };

  // Helper to get active list of fish for playing or previewing
  const getFishList = (level: Level): Fish[] => {
    if (level === 'easy') {
      return fishDatabase.easy;
    }
    if (level === 'medium') {
      return [...fishDatabase.easy, ...fishDatabase.medium];
    }
    if (level === 'hard') {
      return [...fishDatabase.easy, ...fishDatabase.medium, ...fishDatabase.hard];
    }
    if (level === 'expert') {
      // Merge all levels
      return [...fishDatabase.easy, ...fishDatabase.medium, ...fishDatabase.hard];
    }
    return [];
  };

  // @ts-ignore
  const trash_string = ""; /*
  };�白身の魚。', shapeType: 'tuna' }
    ];
  */

  // Play session variables
  const [activePlayList, setActivePlayList] = useState<Fish[]>([]);
  const [playScore, setPlayScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(50); // 50 seconds
  const [totalKeysPressed, setTotalKeysPressed] = useState(0);
  const [correctKeysPressed, setCorrectKeysPressed] = useState(0);
  
  // Active target fish indices
  const [currentFishIndex, setCurrentFishIndex] = useState(0);
  const [typedInput, setTypedInput] = useState<string>(""); // Keystrokes correctly typed so far
  const [wrongInputFlag, setWrongInputFlag] = useState(false);
  const [caughtFishList, setCaughtFishList] = useState<Fish[]>([]);
  const [missedFishList, setMissedFishList] = useState<Fish[]>([]);
  
  const activeTargetFish = activePlayList[currentFishIndex];

  // Derive multi-key roman combinations based on fish reading (hiragana)
  const validRomans = useMemo(() => {
    if (!activeTargetFish) return [];
    const options = generateRomanOptions(activeTargetFish.reading);
    // Include original predefined roman mapping as a fallback if not present
    const orig = activeTargetFish.roman.toLowerCase();
    if (!options.includes(orig)) {
      options.push(orig);
    }
    return options;
  }, [activeTargetFish]);

  // Dynamically determine the best matching roman visualization target
  const currentTargetRoman = useMemo(() => {
    if (validRomans.length === 0) return "";
    // Prioritize candidate matching the current typed input prefix
    const matching = validRomans.find(r => r.startsWith(typedInput));
    if (matching) return matching;
    
    const fallback = activeTargetFish ? activeTargetFish.roman.toLowerCase() : "";
    return validRomans.includes(fallback) ? fallback : validRomans[0];
  }, [validRomans, typedInput, activeTargetFish]);

  const typedProgress = typedInput.length;
  
  // Animation states
  const [isFishingAnimated, setIsFishingAnimated] = useState(false);
  const [lastCaughtFish, setLastCaughtFish] = useState<Fish | null>(null);

  // Fish position for lane scroll simulation
  const [fishXProgress, setFishXProgress] = useState(0); // 0 to 100 percent
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Timer Ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Convert level id to display text
  const getLevelBadge = (lvl: Level) => {
    switch (lvl) {
      case 'easy': return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">優しい（初級）</span>;
      case 'medium': return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">普通（中級）</span>;
      case 'hard': return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">厳しい（上級）</span>;
      case 'expert': return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">エキスパート（超級）</span>;
    }
  };

  // Helper to advance to next fish with full reshuffle once deck is exhausted
  const advanceToNextFish = (currentList: Fish[] = activePlayList, currentIndex: number = currentFishIndex) => {
    setTypedInput("");
    setFishXProgress(0);
    
    if (currentIndex + 1 >= currentList.length) {
      const pool = getFishList(selectedLevel);
      const shuffled = shuffleArray(pool);
      setActivePlayList(shuffled);
      setCurrentFishIndex(0);
    } else {
      setCurrentFishIndex(currentIndex + 1);
    }
  };

  // Initialize Game Play
  const startGame = () => {
    const pool = getFishList(selectedLevel);
    // Shuffle completely
    const shuffled = shuffleArray(pool);
    
    setActivePlayList(shuffled);
    setPlayScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(50);
    setTotalKeysPressed(0);
    setCorrectKeysPressed(0);
    setCurrentFishIndex(0);
    setTypedInput("");
    setWrongInputFlag(false);
    setCaughtFishList([]);
    setMissedFishList([]);
    setFishXProgress(0);
    
    setGameState('playing');
  };

  // Key Event listener for typing本番
  useEffect(() => {
    if (gameState !== 'playing') return;

    const activeTargetFish = activePlayList[currentFishIndex];
    if (!activeTargetFish) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional keys
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;
      
      const charTyped = e.key.toLowerCase();
      setTotalKeysPressed(prev => prev + 1);

      const nextInput = typedInput + charTyped;

      // Check if nextInput is a valid prefix for ANY of the valid roman candidates
      const isValidPrefix = validRomans.some(roman => roman.startsWith(nextInput));

      if (isValidPrefix) {
        // Correct char typed!
        setCorrectKeysPressed(prev => prev + 1);
        setTypedInput(nextInput);

        // Find if this completes the word for any matched candidate
        const isComplete = validRomans.some(roman => roman === nextInput);

        if (isComplete) {
          // Complete word! Fish successfully caught!
          playCatchSound(isMuted);
          const newScore = playScore + 1;
          setPlayScore(newScore);
          setCombo(prev => {
            const newCombo = prev + 1;
            if (newCombo > maxCombo) setMaxCombo(newCombo);
            return newCombo;
          });
          
          setCaughtFishList(prev => {
            if (prev.some(f => f.kanji === activeTargetFish.kanji)) {
              return prev;
            }
            return [...prev, activeTargetFish];
          });
          setLastCaughtFish(activeTargetFish);
          setIsFishingAnimated(true);
          setTimeout(() => setIsFishingAnimated(false), 900);

          // Reset progress and advance to next fish
          advanceToNextFish(activePlayList, currentFishIndex);
        }
      } else {
        // Wrong typing key pressed
        playWrongSound(isMuted);
        setWrongInputFlag(true);
        setCombo(0); // break combo
        setTimeout(() => setWrongInputFlag(false), 180);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, currentFishIndex, typedInput, activePlayList, playScore, maxCombo, validRomans, isMuted]);

  // Game timer loop
  useEffect(() => {
    if (gameState === 'playing') {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setGameState('result');
            
            // Save highscore
            setHighScores(currentScores => {
              const currentLvlScore = currentScores[selectedLevel];
              if (playScore > currentLvlScore) {
                const updated = { ...currentScores, [selectedLevel]: playScore };
                localStorage.setItem('fish_kanji_high_scores', JSON.stringify(updated));
                return updated;
              }
              return currentScores;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState, playScore, selectedLevel]);

  // Scroll simulator (swim lane)
  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      
      // Speed factor based on difficulty
      let speedMultiplier = 1.0;
      if (selectedLevel === 'medium') speedMultiplier = 1.25;
      if (selectedLevel === 'hard') speedMultiplier = 1.6;
      if (selectedLevel === 'expert') speedMultiplier = 2.4; // Expert is significantly faster as requested!
      
      const updateMovement = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const delta = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Base scroll across lane: 12 seconds
        const percentPerMs = (100 / 12000) * speedMultiplier;
        
        setFishXProgress(prev => {
          const next = prev + percentPerMs * delta;
          if (next >= 100) {
            // Swam away! No penalty, combo breaks
            setCombo(0);
            setWrongInputFlag(false);
            
            // Record missed fish
            const escapedFish = activePlayList[currentFishIndex];
            if (escapedFish) {
              setMissedFishList(prevList => {
                if (prevList.some(f => f.kanji === escapedFish.kanji)) {
                  return prevList;
                }
                return [...prevList, escapedFish];
              });
            }
            
            // Cycle to next fish in deck using shuffling helper
            advanceToNextFish(activePlayList, currentFishIndex);
            return 0;
          }
          return next;
        });

        animationFrameRef.current = requestAnimationFrame(updateMovement);
      };

      animationFrameRef.current = requestAnimationFrame(updateMovement);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, currentFishIndex, activePlayList, selectedLevel]);

  // Silhouette Vector renderer
  const renderSilhouette = (type: Fish['shapeType'], scale: number = 1, isOutline: boolean = false) => {
    const fillClass = isOutline ? 'fill-slate-800 stroke-slate-700/60' : 'fill-slate-900/55 stroke-slate-800/80 drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]';
    
    switch (type) {
      case 'tuna':
        return (
          <svg className={`w-20 h-14 transition-transform ${fillClass}`} viewBox="0 0 100 60" style={{ transform: `scale(${scale})` }}>
            <path d="M10 30 C 25 15, 60 10, 85 25 C 90 20, 95 15, 98 12 C 96 25, 96 35, 98 48 C 95 45, 90 40, 85 35 C 60 50, 25 45, 10 30" strokeWidth="2.5" />
            <path d="M40 18 C 45 12, 50 12, 52 18" strokeWidth="1.5" fill="none" />
            <path d="M50 42 C 45 48, 40 48, 38 42" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'round':
        return (
          <svg className={`w-20 h-14 transition-transform ${fillClass}`} viewBox="0 0 100 60" style={{ transform: `scale(${scale})` }}>
            <path d="M10 30 C 20 5, 70 5, 85 25 C 92 18, 96 12, 98 8 C 95 24, 95 36, 98 52 C 96 48, 92 42, 85 35 C 70 55, 20 55, 10 30" strokeWidth="2.5" />
            <path d="M35 15 Q 40 10, 48 12" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'flat':
        return (
          <svg className={`w-20 h-14 transition-transform ${fillClass}`} viewBox="0 0 100 60" style={{ transform: `scale(${scale})` }}>
            <path d="M15 30 C 25 20, 65 20, 85 30 C 92 25, 95 20, 97 15 C 95 26, 95 34, 97 45 C 95 40, 92 35, 85 30 C 65 40, 25 40, 15 30" strokeWidth="2.5" />
            <circle cx="75" cy="24" r="2" className={isOutline ? 'fill-slate-600' : 'fill-blue-400'} />
            <circle cx="78" cy="26" r="2" className={isOutline ? 'fill-slate-600' : 'fill-blue-400'} />
          </svg>
        );
      case 'shark':
        return (
          <svg className={`w-20 h-14 transition-transform ${fillClass}`} viewBox="0 0 100 60" style={{ transform: `scale(${scale})` }}>
            <path d="M5 32 C 15 20, 45 10, 80 25 C 88 18, 94 10, 98 4 C 95 22, 94 38, 98 56 C 94 48, 88 42, 80 35 C 45 50, 15 44, 5 32" strokeWidth="2.5" />
            <path d="M38 18 Q 45 1, 52 14" strokeWidth="2.5" fill="none" />
          </svg>
        );
      case 'shell':
        return (
          <svg className={`w-14 h-14 transition-transform ${fillClass}`} viewBox="0 0 60 60" style={{ transform: `scale(${scale})` }}>
            <path d="M10 50 C 5 25, 25 5, 50 10 C 55 25, 45 45, 10 50 Z" strokeWidth="2.5" />
            <path d="M18 43 C 25 35, 35 25, 44 14" strokeWidth="1.5" fill="none" />
            <path d="M14 36 C 22 28, 32 18, 41 9" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'shrimp':
        return (
          <svg className={`w-20 h-14 transition-transform ${fillClass}`} viewBox="0 0 100 60" style={{ transform: `scale(${scale})` }}>
            <path d="M10 40 Q 25 15, 60 20 Q 75 25, 85 15 C 80 22, 80 30, 85 38 Q 70 30, 60 35 Q 25 45, 10 40" strokeWidth="2.5" />
            <path d="M85 15 C 92 10, 96 12, 99 15" strokeWidth="1.5" fill="none" />
            <path d="M85 15 C 90 20, 95 25, 98 32" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'octopus':
        return (
          <svg className={`w-16 h-16 transition-transform ${fillClass}`} viewBox="0 0 60 60" style={{ transform: `scale(${scale})` }}>
            <path d="M 30,5 C 20,5 12,12 12,25 C 12,32 18,36 22,38 C 21,42 16,45 10,48 C 20,48 24,42 26,40 C 28,42 24,47 20,52 C 30,50 31,44 32,41 C 34,44 35,50 45,52 C 41,47 37,42 39,40 C 41,42 45,48 55,48 C 49,45 44,42 43,38 C 47,36 53,32 53,25 C 53,12 45,5 30,5 Z" strokeWidth="2.5" />
            <circle cx="24" cy="22" r="2.5" className={isOutline ? 'fill-slate-600' : 'fill-blue-400'} />
            <circle cx="36" cy="22" r="2.5" className={isOutline ? 'fill-slate-600' : 'fill-blue-400'} />
          </svg>
        );
      default:
        return (
          <svg className={`w-20 h-14 ${fillClass}`} viewBox="0 0 100 60">
            <ellipse cx="50" cy="30" rx="35" ry="15" strokeWidth="2" />
          </svg>
        );
    }
  };

  // Accuracy calculation helper
  const calculateAccuracy = () => {
    if (totalKeysPressed === 0) return 100;
    return Math.round((correctKeysPressed / totalKeysPressed) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col antialiased select-none">
      
      {/* 1. Header (Title Bar) */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 px-6 py-2.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <TitleLogo className="h-11 md:h-14 w-auto" />
          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold mt-1">
            PROTOTYPE v1.2
          </span>
        </div>

        {/* Workspace Mode Switcher (Specification vs Live Sandbox Demo) */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setAppMode('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              appMode === 'game' 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>ゲームプレイ(本編デモ)</span>
          </button>
          <button
            onClick={() => setAppMode('spec')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              appMode === 'spec' 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>仕様書ビューアー</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* APP MODE: SPECIFICATION VIEW */}
        {appMode === 'spec' && (
          <div className="flex-1 overflow-y-auto bg-slate-950/30 p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 bg-slate-950/60 p-6 md:p-10 rounded-2xl border border-slate-800 shadow-xl">
              <div className="border-b border-slate-800 pb-5 text-center">
                <span className="text-xs text-blue-400 uppercase tracking-widest font-mono font-bold">Document</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">魚漢字タイピングゲーム 企画・仕様書</h2>
                <p className="text-sm text-slate-400 mt-2">熟練のゲームデザイナー＆プログラマーによる設計仕様書</p>
              </div>

              {/* Specification Content Mockup */}
              <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
                    <span className="w-1.5 h-4 bg-blue-500 rounded"></span>
                    1. ゲーム概要
                  </h3>
                  <p>魚の漢字の読み方をローマ字タイピングして、勢いよく釣り上げる爽快な知育ゲームです。段階的なレベル設計により、子供のタイピング練習から大人の本気の脳トレ・難読漢字学習まで幅広く貢献します。</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-xs pl-2 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
                    <li>ジャンル：タイピング、日本語教育、脳トレ</li>
                    <li>プレイ時間：50秒 制限時間制</li>
                    <li>操作方法：PCキーボードによるローマ字入力</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
                    <span className="w-1.5 h-4 bg-blue-500 rounded"></span>
                    2. 画面構成
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 text-[10px] inline-flex items-center justify-center font-bold">1</span>
                        タイトル ＆ レベル選択画面
                      </h4>
                      <p className="text-xs text-slate-400">タイトルロゴ、難易度（優しい、普通、厳しい、エキスパート）の選択ボタン、および最高得点（ハイスコア）を表示。スタートボタンを中央に配置。</p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 text-[10px] inline-flex items-center justify-center font-bold">2</span>
                        出現魚一覧（事前予習画面）
                      </h4>
                      <p className="text-xs text-slate-400">ゲーム開始前にそのステージで出現する魚（選択した難易度に応じて20〜58種類）を一覧で予習。漢字・読み・豆知識が表示され、スペースキーでゲームを開始。</p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 text-[10px] inline-flex items-center justify-center font-bold">3</span>
                        タイピングゲーム画面
                      </h4>
                      <p className="text-xs text-slate-400">各魚の特徴的なシルエットが左から右へ泳ぎ、上部には漢字問題が表示。プレイヤーは正しいローマ字入力で魚を釣り上げます。</p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 text-[10px] inline-flex items-center justify-center font-bold">4</span>
                        リザルト ＆ 復習画面
                      </h4>
                      <p className="text-xs text-slate-400">釣り上げ総数（釣果）、最高コンボ、キー正確率を表示。今回出題された魚たちの漢字リストをおさらいでき、学習を完了させます。</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
                    <span className="w-1.5 h-4 bg-blue-500 rounded"></span>
                    3. コアメカニクス ＆ 追加の決定事項
                  </h3>
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300"><strong>エキスパート（超級）レベルの追加：</strong> 優しい、普通、厳しいすべての漢字（41種類）がランダムに出題され、さらに魚の移動速度が2.2倍に上昇する最高難易度です。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300"><strong>コンボ・ハイスコアシステム：</strong> ミスをせず連続で正しく入力するとコンボが繋がり、スコアが加算されます。ハイスコアはブラウザの <code>localStorage</code> に保存され、プレイヤーの向上心を刺激します。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300"><strong>独自の魚シルエット表現：</strong> 各魚種をマグロ型・シャーク型・平ら型・貝殻型・エビ型などに分類。形でどんな魚かある程度推測できるようデザインされています。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300"><strong>ノーペナルティ：</strong> 魚が画面外に消えても減点などのペナルティは一切なく、タイピング初心者にも非常に優しい「人のためになる」親切な設計を徹底します。</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
                    <span className="w-1.5 h-4 bg-blue-500 rounded"></span>
                    4. 出現漢字の分類データベース
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3 font-mono text-xs text-slate-300">
                    <div className="bg-emerald-950/20 p-3 rounded border border-emerald-900/30">
                      <h4 className="text-emerald-400 font-bold mb-1 border-b border-emerald-900/30 pb-1">【優しい】（20種）</h4>
                      <span>鮪、鮭、鯛、鰯、鯖、鰹、蛸、鱈、鮎、鯉、鰻、鮫、貝、鰊、鱒、鮒、鰡、蜆、鯏、鯔</span>
                    </div>
                    <div className="bg-amber-950/20 p-3 rounded border border-amber-900/30">
                      <h4 className="text-amber-400 font-bold mb-1 border-b border-amber-900/30 pb-1">【普通】（18種）</h4>
                      <span>鰆、鰺、鰈、鰤、鮃、鮑、鯑、鮴、鱪、鱚、鰌、鰍、鯏（うぐい）、鯔（いな）、鱠、鰏、鯧、鯳</span>
                    </div>
                    <div className="bg-rose-950/20 p-3 rounded border border-rose-900/30">
                      <h4 className="text-rose-400 font-bold mb-1 border-b border-rose-900/30 pb-1">【厳しい】（20種）</h4>
                      <span>鯒、鰰、鰔、鰕、鱏、鮗、鱇、鱟、鱘、魴、鰦、鯐、鱸、鮴（ごり）、鮟、鱖、鱧、鰣、鰾、鱵</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                <p className="text-xs text-slate-500 font-mono">魚漢字タイピングゲーム 企画書.md より</p>
                <button 
                  onClick={() => setAppMode('game')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 shadow-md transition-all"
                >
                  <span>実際にゲーム画面をテストする</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APP MODE: PLAY INTERACTIVE DEMO */}
        {appMode === 'game' && (
          <div className="flex-1 flex flex-col bg-[#0a315c] relative overflow-hidden">
            
            {/* Water Wave Visual Background and Bubble Effects - Bright Aqua & Emerald Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 via-teal-300 to-blue-500 pointer-events-none z-0">
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/35 to-transparent"></div> {/* Sunbeams Layer */}
              <div className="absolute top-4 left-1/4 w-48 h-48 bg-white/25 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-12 right-1/4 w-64 h-64 bg-teal-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              <div className="absolute bottom-20 left-1/3 w-56 h-56 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            <AnimatePresence mode="wait">
              
              {/* STATE 1: TITLE SCREEN */}
              {gameState === 'title' && (
                <motion.div
                  key="title"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative overflow-y-auto"
                >
                  <div className="max-w-xl w-full text-center space-y-6 bg-slate-900/75 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600"></div>

                    {/* Trophy & Sound settings header inside card */}
                    <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-amber-400">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        <span>RECORDS</span>
                      </div>
                      <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className="p-1.5 bg-slate-950 rounded-full border border-slate-800 text-slate-400 hover:text-white transition-all"
                        title={isMuted ? "音をオンにする" : "ミュート"}
                      >
                        {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-blue-400" />}
                      </button>
                    </div>

                    {/* Logo & Title */}
                    <div className="space-y-3 flex flex-col items-center">
                      <span className="text-xs bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent font-extrabold tracking-widest uppercase">
                        一漁一会 ・ 知育タイピング
                      </span>
                      <TitleLogo className="h-32 md:h-40 w-auto filter drop-shadow-2xl" />
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto text-center mt-2">
                        流れてくる魚の漢字の「読み」をローマ字で入力し、<br />
                        制限時間内に何匹の魚を釣り上げられるか競いましょう！
                      </p>
                    </div>

                    {/* LEVEL / DIFFICULTY SELECTOR */}
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <span>🎮 難易度（レベル）を選択：</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        {(['easy', 'medium', 'hard', 'expert'] as Level[]).map((lvl) => {
                          const isSel = selectedLevel === lvl;
                          let name = '';
                          let col = '';
                          let desc = '';
                          if (lvl === 'easy') { name = '優しい（初級）'; col = 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5 bg-slate-950/40'; if (isSel) col = 'bg-emerald-500/20 border-emerald-500 text-emerald-400'; desc = '鮪、鮭、鯛など基本14種'; }
                          if (lvl === 'medium') { name = '普通（中級）'; col = 'border-amber-500/20 text-amber-400 hover:bg-amber-500/5 bg-slate-950/40'; if (isSel) col = 'bg-amber-500/20 border-amber-500 text-amber-400'; desc = '鰆、鰤、鮃など中級15種'; }
                          if (lvl === 'hard') { name = '厳しい（上級）'; col = 'border-rose-500/20 text-rose-400 hover:bg-rose-500/5 bg-slate-950/40'; if (isSel) col = 'bg-rose-500/20 border-rose-500 text-rose-400'; desc = '鯒、鰰、鱏など難読12種'; }
                          if (lvl === 'expert') { name = 'エキスパート（超級）'; col = 'border-purple-500/20 text-purple-400 hover:bg-purple-500/5 bg-slate-950/40'; if (isSel) col = 'bg-purple-500/20 border-purple-500 text-purple-400'; desc = '全41種が高速出現！'; }

                          return (
                            <button
                              key={lvl}
                              onClick={() => setSelectedLevel(lvl)}
                              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all group ${col}`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-bold">{name}</span>
                                <span className="text-[10px] opacity-75 font-mono">
                                  BEST: <strong className="text-white">{highScores[lvl]}匹</strong>
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 mt-1 block leading-tight">{desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* FURIGANA TOGGLE OPTION */}
                    <div className="space-y-2 text-left bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                            <span>🏷️ 漢字の振り仮名（読み・ヒント）</span>
                          </label>
                          <p className="text-[10px] text-slate-400">ゲーム中にひらがなの「読み」や「和名」を表示します</p>
                        </div>
                        <button
                          onClick={() => setShowFurigana(!showFurigana)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            showFurigana ? 'bg-blue-600' : 'bg-slate-700'
                          }`}
                          id="toggle-furigana"
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              showFurigana ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* START BUTTON */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          // Show Preview list first to learn!
                          setGameState('preview-list');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all text-base hover:-translate-y-0.5"
                      >
                        <Play className="h-5 w-5 fill-white text-white" />
                        <span>この難易度で予習＆スタート！</span>
                      </button>
                    </div>

                    {/* Score clear option */}
                    <div className="flex justify-center">
                      <button 
                        onClick={resetHighScores}
                        className="text-[10px] text-slate-500 hover:text-slate-300 transition-all flex items-center gap-1 font-mono"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>全レベルのハイスコアをリセット</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE 2: PREVIEW LEARNING LIST BEFORE PLAY */}
              {gameState === 'preview-list' && (
                <motion.div
                  key="preview-list"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col p-6 z-10 relative overflow-hidden"
                >
                  <div className="max-w-3xl w-full mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-2xl flex-1 flex flex-col overflow-hidden backdrop-blur-md">
                    
                    {/* Preview header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800 pb-4 mb-4 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-bold">STAGE PREVIEW</span>
                          {getLevelBadge(selectedLevel)}
                        </div>
                        <h3 className="text-xl font-bold text-white mt-1">
                          出現する魚を予習しよう！
                        </h3>
                        <p className="text-xs text-slate-400">事前におさらいしておくことで、タイピングがスムーズになります。</p>
                      </div>
                      
                      {/* Play Action button */}
                      <button
                        onClick={startGame}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all self-start sm:self-center shrink-0 animate-bounce"
                      >
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                        <span>準備完了！ゲーム本番へ</span>
                      </button>
                    </div>

                    {/* Scrollable list of fish */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                      <div className="grid md:grid-cols-2 gap-3">
                        {getFishList(selectedLevel).map((fish, index) => (
                          <div key={index} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-start gap-3">
                            {/* Graphic Silhouette / Fish Kanji */}
                            <div className="w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 shrink-0 text-2xl font-bold text-blue-400">
                              {fish.kanji}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{fish.reading}</h4>
                                <span className="text-[10px] font-mono text-slate-500">({fish.roman})</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-normal">{fish.meaning} ― <span className="text-[11px] text-slate-500 italic">{fish.origin}</span></p>
                              {/* Small outline representation */}
                              <div className="pt-1 flex items-center gap-1.5">
                                {renderSilhouette(fish.shapeType, 0.55, true)}
                                <span className="text-[9px] text-slate-600 font-mono uppercase">{fish.shapeType} shape</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom guidance */}
                    <div className="border-t border-slate-800/60 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-blue-400" />
                        <span>読みにくいものはガイドアルファベットを頼りにそのままキーを打てます</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">出現数: {getFishList(selectedLevel).length}種類</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE 3: ACTIVE PLAY GAMEPLAY SCREEN */}
              {gameState === 'playing' && activeTargetFish && (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col z-10 relative overflow-hidden"
                >
                  {/* Top Bar Indicators */}
                  <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      {getLevelBadge(selectedLevel)}
                      <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-xs font-mono">
                        <Flame className={`h-3.5 w-3.5 ${combo > 0 ? 'text-amber-500 animate-bounce' : 'text-slate-600'}`} />
                        <span className="text-slate-400">Combo:</span>
                        <span className="text-amber-400 font-bold">{combo}</span>
                      </div>
                    </div>

                    {/* 90 seconds Timer Indicator */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-1.5 rounded-xl border border-slate-800">
                        <Timer className={`h-4 w-4 ${timeLeft < 15 ? 'text-rose-500 animate-ping' : 'text-blue-400'}`} />
                        <span className="text-xs text-slate-400 font-bold font-mono">TIME LEFT:</span>
                        <span className={`font-mono text-lg font-black ${timeLeft < 15 ? 'text-rose-500' : 'text-white'}`}>
                          {timeLeft}s
                        </span>
                      </div>

                      {/* Score display */}
                      <div className="bg-slate-950/80 px-4 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-400" />
                        <span className="text-xs text-slate-400 font-bold font-mono">釣果:</span>
                        <span className="font-mono text-lg font-black text-emerald-400">{playScore} 匹</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Ocean Swim Lane (The central scroll board) */}
                  <div className="flex-1 relative bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 flex flex-col justify-between">
                    
                    {/* Water currents visual markers */}
                    <div className="absolute inset-0 flex flex-col justify-around opacity-25 pointer-events-none">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
                    </div>

                    {/* SCROLLING TARGET SWIM LANE */}
                    <div className="flex-1 w-full relative flex items-center overflow-hidden">
                      {/* Swimming Fish Entity */}
                      <div 
                        className="absolute flex flex-col items-center justify-center"
                        style={{ 
                          left: `${fishXProgress}%`,
                          transform: 'translateX(-50%)',
                          top: '30%'
                        }}
                      >
                        {/* Shaking & Fishing Effect wrap */}
                        <div className={`relative flex flex-col items-center ${wrongInputFlag ? 'animate-bounce' : ''}`}>
                          
                          {/* Fish Silhouette Graphic (Dynamic vector with colors based on progress/state) */}
                          <div className={`transition-all ${isFishingAnimated ? 'translate-y-[-100px] opacity-0 scale-50 duration-1000' : ''}`}>
                            {renderSilhouette(activeTargetFish.shapeType, 1.3)}
                          </div>

                          {/* Fishing animation rod visual overlay */}
                          {isFishingAnimated && (
                            <div className="absolute top-[-100px] left-1/2 translate-x-[-50%] flex flex-col items-center">
                              <div className="w-0.5 h-32 bg-yellow-400/80 animate-pulse"></div>
                              <div className="text-2xl animate-ping">🎣</div>
                            </div>
                          )}

                          {/* Float bubble showing the Fish Kanji problem */}
                          <div className="mt-4 bg-slate-900/90 border-2 border-blue-500/50 px-6 py-2.5 rounded-2xl shadow-xl backdrop-blur-md text-center min-w-[120px] relative">
                            <span className="text-4xl font-extrabold text-white tracking-tight block">
                              {activeTargetFish.kanji}
                            </span>
                            {showFurigana ? (
                              <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
                                {activeTargetFish.meaning}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">
                                ？？？
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* KEYBOARD TYPING INPUT CONSOLE (Bottom of ocean screen) */}
                    <div className="w-full max-w-2xl mx-auto space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-2xl backdrop-blur-md relative z-20">
                      
                      {/* Roman Guide Navigation */}
                      <div className="text-center space-y-1">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-mono font-bold block">
                          {showFurigana ? "ローマ字をキーボードで打ちましょう" : "漢字から読みを推測してキーボードで打ちましょう（伏せ字）"}
                        </span>
                        
                        {/* Interactive Roman letters styling */}
                        <div className="flex items-center justify-center gap-1.5 py-1">
                          {currentTargetRoman.split('').map((char, charIdx) => {
                            let charClass = 'text-slate-500 bg-slate-950 border-slate-800';
                            if (charIdx < typedProgress) {
                              charClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40 font-black';
                            } else if (charIdx === typedProgress) {
                              charClass = 'text-white bg-blue-600 border-blue-400 animate-pulse font-black scale-110';
                            }
                            
                            // 振り仮名非表示の時は、未入力文字を「？」で伏せることで答えのネタバレを防止する
                            const displayChar = (showFurigana || charIdx < typedProgress) ? char : '?';

                            return (
                              <span 
                                key={charIdx} 
                                className={`w-8 h-10 border rounded-lg flex items-center justify-center font-mono text-lg transition-all ${charClass}`}
                              >
                                {displayChar}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Visual indicator of reading */}
                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>読み: <strong className="text-white text-sm ml-1">{showFurigana ? activeTargetFish.reading : "（非表示）"}</strong></span>
                        </span>
                        
                        <span className="text-slate-500 text-[10px]">
                          {showFurigana ? `ヒント: ${activeTargetFish.meaning}の形から推測しよう！` : "ヒント: 魚の形と漢字から思い出そう！"}
                        </span>
                      </div>

                      {/* Invisible Input for mobile/browser trigger fallback */}
                      <div className="text-center">
                        <span className="text-[10px] bg-slate-950/60 text-slate-500 px-3 py-1 rounded-full border border-slate-800/80 font-mono inline-block">
                          💡 キー入力を直接受け付けています。バックスペースは不要です。
                        </span>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}

              {/* STATE 4: RESULT SCREEN */}
              {gameState === 'result' && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative overflow-y-auto"
                >
                  <div className="max-w-3xl w-full bg-slate-900/90 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden space-y-6">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>

                    {/* Result Header */}
                    <div className="text-center space-y-1">
                      <span className="text-xs text-blue-400 font-bold uppercase tracking-widest font-mono">タイムアップ！</span>
                      <h3 className="text-3xl font-black text-white">本日の釣果発表</h3>
                      <p className="text-xs text-slate-400">素晴らしい挑戦でした！学んだ漢字をおさらいしましょう。</p>
                    </div>

                    {/* Performance metrics dashboard */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold font-mono uppercase block">釣り上げた数</span>
                        <span className="text-3xl font-black text-emerald-400 font-mono">{playScore}</span>
                        <span className="text-[10px] text-slate-400 block">匹</span>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold font-mono uppercase block">最大コンボ数</span>
                        <span className="text-3xl font-black text-amber-400 font-mono">{maxCombo}</span>
                        <span className="text-[10px] text-slate-400 block">連続正解</span>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold font-mono uppercase block">キー正確率</span>
                        <span className="text-3xl font-black text-blue-400 font-mono">{calculateAccuracy()}%</span>
                        <span className="text-[10px] text-slate-400 block">ミスタイプ含む</span>
                      </div>
                    </div>

                    {/* List of caught fish */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <BookMarked className="h-4 w-4 text-emerald-400" />
                        <span>釣り上げた魚漢字リスト（復習メモ）:</span>
                      </h4>

                      {caughtFishList.length === 0 ? (
                        <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 text-center text-slate-500 text-xs">
                          まだ釣り上げた魚はいません。次は予習リストを見て再挑戦しましょう！
                        </div>
                      ) : (
                        <div className="max-h-36 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {caughtFishList.map((fish, index) => (
                              <div key={index} className="p-3 bg-slate-950/50 rounded-xl border border-emerald-500/10 flex items-center gap-3">
                                <span className="text-2xl font-bold text-emerald-400 w-10 h-10 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                  {fish.kanji}
                                </span>
                                <div className="text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white">{fish.reading}</span>
                                    <span className="text-[9px] font-mono text-slate-500">({fish.roman})</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{fish.origin}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* List of missed fish */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-rose-400" />
                        <span>釣り逃した魚漢字リスト（リベンジメモ）:</span>
                      </h4>

                      {missedFishList.length === 0 ? (
                        <div className="p-4 bg-slate-950/40 rounded-2xl border border-emerald-500/10 text-center text-emerald-400 text-xs font-medium">
                          🎉 素晴らしい！今回のプレイでは一匹も魚を逃しませんでした！
                        </div>
                      ) : (
                        <div className="max-h-36 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {missedFishList.map((fish, index) => (
                              <div key={index} className="p-3 bg-slate-950/50 rounded-xl border border-rose-500/10 flex items-center gap-3">
                                <span className="text-2xl font-bold text-rose-400 w-10 h-10 rounded-lg bg-rose-950/30 border border-rose-500/20 flex items-center justify-center shrink-0">
                                  {fish.kanji}
                                </span>
                                <div className="text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white">{fish.reading}</span>
                                    <span className="text-[9px] font-mono text-slate-500">({fish.roman})</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{fish.origin}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action navigation buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={startGame}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>同じレベルでもう一度遊ぶ</span>
                      </button>

                      <button
                        onClick={() => setGameState('title')}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-sm border border-slate-700"
                      >
                        <span>レベルを変える・タイトルに戻る</span>
                      </button>
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-3.5 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© 2026 魚漢字タイピングゲーム プロジェクト - 熟練のゲームデザイナー＆プログラマー</p>
        <p className="font-mono text-[10px] text-slate-600">Built with React 19 & Tailwind CSS 4</p>
      </footer>
    </div>
  );
}
