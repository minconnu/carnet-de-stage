
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Save, FileText, Plus, FolderOpen, ChevronLeft, ChevronRight, Camera, Image as ImageIcon, Trash2, Home, Hammer, Ruler, DraftingCompass, PencilLine, Box, ClipboardCheck, Info, MessageSquareQuote, Download, Upload, Settings, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { StageData, DayEntry, ViewState } from './types';

// Constants for assets
const SCHOOL_LOGO_URL = "indbg.png"; 
const MENU_LOGO_URL = "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400"; 

const EVAL_POINTS = [
  "J’ai une présentation correcte",
  "Je respecte les horaires",
  "Je tiens compte des conseils et des remarques",
  "Je demande des explications",
  "Je suis poli et courtois",
  "Je fais l’effort pour m’intégrer facilement dans l’équipe",
  "J’adapte mon comportement à la situation",
  "Je me montre intéressé",
  "J’applique les consignes",
  "Je me mets rapidement au travail",
  "J’accomplis mon travail dans un temps imparti",
  "Je suis capable de réaliser une tâche seul",
  "Je travaille avec soin",
  "Je travaille avec précision",
  "Je termine le travail commencé",
  "Je suis capable d’auto-évaluer mon travail",
  "Je respecte les règles de l’entreprise",
  "Je trie et évacue les déchets",
  "Je respecte les règles de sécurité et d’hygiène"
];

const EVAL_TEXT_POINTS = [
  { id: 20, label: "Mes points forts sont :" },
  { id: 21, label: "Mes difficultés sont :" },
  { id: 22, label: "Ce que je dois absolument améliorer :" },
  { id: 23, label: "Ce que j'ai découvert :" },
  { id: 24, label: "Ce qui m'a surpris :" },
  { id: 25, label: "Ce que j'ai appris :" },
  { id: 26, label: "J'ai été déçu par :" },
  { id: 27, label: "J'ai particulièrement apprécié :" },
  { id: 28, label: "J'aimerais travailler dans cette entreprise parce que :" }
];

const EVAL_OPTIONS = ["Toujours", "Souvent", "Parfois", "Jamais"];

const INITIAL_STAGE: StageData = {
  id: Date.now().toString(),
  nom: '',
  prenom: '',
  dateDebut: '',
  dateFin: '',
  lieu: '',
  evaluation: {},
  evalComments: {},
  entries: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    date: '',
    description: '',
    photos: []
  }))
};

const App: React.FC = () => {
  const [stage, setStage] = useState<StageData>(INITIAL_STAGE);
  const [currentPage, setCurrentPage] = useState<number>(0); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [savedStages, setSavedStages] = useState<StageData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const data = localStorage.getItem('carnet_stages');
    if (data) {
      try {
        setSavedStages(JSON.parse(data));
      } catch (e) {
        console.error("Error loading saved stages", e);
      }
    }
  }, []);

  // Fonction pour calculer le N-ième jour ouvrable à partir d'une date
  const getWorkingDayLabel = (startDateStr: string, dayIndex: number): string => {
    if (!startDateStr) return "Date non définie";
    
    let date = new Date(startDateStr);
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

    // Ajuster au premier jour ouvrable si la date de début tombe un weekend
    while (isWeekend(date)) {
      date.setDate(date.getDate() + 1);
    }

    // Avancer de dayIndex jours ouvrables supplémentaires
    let count = 0;
    while (count < dayIndex) {
      date.setDate(date.getDate() + 1);
      if (!isWeekend(date)) {
        count++;
      }
    }

    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const saveStageInternal = (silent = false) => {
    const updated = [...savedStages];
    const index = updated.findIndex(s => s.id === stage.id);
    if (index >= 0) {
      updated[index] = stage;
    } else {
      updated.push(stage);
    }
    setSavedStages(updated);
    localStorage.setItem('carnet_stages', JSON.stringify(updated));
    if (!silent) alert("✔️ Progression enregistrée sur l'appareil !");
  };

  const exportDataToFile = () => {
    const defaultName = `Carnet_${stage.nom || 'Stage'}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`;
    const fileName = prompt("Nommer votre sauvegarde (elle sera dans vos téléchargements) :", defaultName);
    
    if (!fileName) return;

    const dataStr = JSON.stringify(stage, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const finalFileName = `CarnetDeStage_${fileName}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', finalFileName);
    linkElement.click();
    
    alert("Fichier de sauvegarde généré !");
  };

  const importDataFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        setStage(importedData);
        alert("✔️ Données importées avec succès !");
        setIsMenuOpen(false);
      } catch (error) {
        alert("Erreur lors de l'importation. Le fichier est peut-être corrompu.");
      }
    };
    reader.readAsText(file);
  };

  const createNewStage = () => {
    if (confirm("Voulez-vous vraiment créer un nouveau carnet ? Pensez à sauvegarder l'actuel !")) {
      setStage({ ...INITIAL_STAGE, id: Date.now().toString() });
      setCurrentPage(0);
      setIsMenuOpen(false);
    }
  };

  const openStage = (s: StageData) => {
    setStage(s);
    setCurrentPage(0);
    setIsMenuOpen(false);
  };

  const exportPDF = async () => {
    if (!pdfRef.current) return;
    
    const defaultPdfName = `Rapport_Stage_${stage.nom || 'Eleve'}`;
    const fileName = prompt("Comment voulez-vous nommer le PDF final ?", defaultPdfName);
    if (!fileName) return;

    setIsGenerating(true);
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    for (let i = 0; i <= 12; i++) {
      setCurrentPage(i);
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      const canvas = await html2canvas(pdfRef.current, { 
        scale: 1.5, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.6); 
      
      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, width, height, undefined, 'FAST');
    }
    
    doc.save(`CarnetDeStage_${fileName}.pdf`);
    setIsGenerating(false);
    alert("✨ Votre PDF a été généré et envoyé vers vos téléchargements !");
  };

  const handlePhotoUpload = (dayIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newEntries = [...stage.entries];
        if (newEntries[dayIndex].photos.length < 2) {
          newEntries[dayIndex].photos.push(base64String);
          setStage({ ...stage, entries: newEntries });
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const removePhoto = (dayIndex: number, photoIndex: number) => {
    const newEntries = [...stage.entries];
    newEntries[dayIndex].photos.splice(photoIndex, 1);
    setStage({ ...stage, entries: newEntries });
  };

  const handleEvalChange = (pointIdx: number, value: string) => {
    setStage(prev => ({
      ...prev,
      evaluation: { ...prev.evaluation, [pointIdx]: value }
    }));
  };

  const handleCommentChange = (pointId: number, value: string) => {
    setStage(prev => ({
      ...prev,
      evalComments: { ...prev.evalComments, [pointId]: value }
    }));
  };

  return (
    <div className="h-screen bg-[#fdf8f1] flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-amber-900/10">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}></div>

      {isGenerating && (
        <div className="absolute inset-0 z-[100] bg-amber-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-10 text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-black mb-2 uppercase tracking-widest">Création du PDF...</h2>
          <p className="text-sm opacity-80 italic">Ceci peut prendre quelques secondes selon le nombre de photos.</p>
        </div>
      )}

      {isMenuOpen && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm no-print">
          <div className="w-72 h-full bg-[#fdf8f1] shadow-2xl p-6 flex flex-col gap-5 border-r-4 border-amber-800 animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center border-b-2 border-amber-200 pb-4">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <Settings size={24} /> Options
              </h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-amber-700 p-2">
                <Plus className="rotate-45" />
              </button>
            </div>
            
            <button onClick={createNewStage} className="flex items-center gap-3 p-4 bg-amber-700 text-white rounded-xl font-bold shadow-md active:scale-95 transition">
              <Plus size={20} /> Nouveau carnet
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button onClick={exportDataToFile} className="flex flex-col items-center justify-center gap-1 p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-[10px] font-black uppercase">
                <Download size={18} /> Sauvegarder
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 p-3 bg-sky-100 text-sky-800 rounded-xl border border-sky-200 text-[10px] font-black uppercase">
                <Upload size={18} /> Charger
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importDataFromFile} />
              </button>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-hidden">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-2">Travaux en cours</span>
              <div className="overflow-y-auto flex flex-col gap-2 no-scrollbar">
                {savedStages.length === 0 && <p className="text-[10px] text-amber-400 italic px-2">Aucun stage sauvegardé</p>}
                {savedStages.map(s => (
                  <button key={s.id} onClick={() => openStage(s)} className="flex items-center gap-3 p-3 text-sm text-left bg-white border border-amber-100 rounded-lg shadow-sm active:bg-amber-50">
                    <Box size={16} className="text-amber-600 shrink-0" /> 
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-amber-900 truncate">{s.nom || "Utilisateur"}</span>
                      <span className="text-[10px] text-amber-500">{s.dateDebut || "Pas de date"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto p-4 bg-amber-100/50 rounded-2xl border border-amber-200">
                <p className="text-[10px] text-amber-800 font-bold mb-1 flex items-center gap-1"><Info size={12}/> ASTUCE APK</p>
                <p className="text-[9px] text-amber-700 leading-tight">Pour installer l'app, utilise l'option "Ajouter à l'écran d'accueil" de ton navigateur Chrome.</p>
            </div>
          </div>
        </div>
      )}

      <div ref={pdfRef} className="flex-1 flex flex-col bg-white relative overflow-hidden">
        {currentPage === 0 && (
          <div className="flex-1 flex flex-col items-center px-6 py-6 overflow-y-auto no-scrollbar">
            <div className="w-full flex justify-center mb-6">
              <div className="w-64 h-36 flex items-center justify-center bg-white rounded-3xl p-2 shadow-sm border border-amber-50">
                <img src={SCHOOL_LOGO_URL} alt="Institut Notre-Dame Beauraing" className="max-w-full max-h-full object-contain" />
              </div>
            </div>

            <div className="relative mb-6 text-center">
              <h1 className="text-3xl font-black text-amber-900 leading-tight uppercase tracking-tight">
                Carnet <span className="text-amber-600 block">de stage</span>
              </h1>
              <div className="h-1.5 w-24 bg-amber-500 mx-auto mt-3 rounded-full"></div>
            </div>

            <div className="relative mb-8">
              <div className="w-40 h-40 relative rounded-[2.5rem] overflow-hidden border-[6px] border-amber-800 shadow-2xl z-10 rotate-3 transition-transform hover:rotate-0">
                <img src={MENU_LOGO_URL} alt="Menuiserie" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-amber-100 p-3 rounded-2xl border-4 border-white shadow-xl z-20">
                <Hammer size={24} className="text-amber-800" />
              </div>
            </div>

            <div className="w-full space-y-4 bg-amber-50/50 p-6 rounded-[2.5rem] border-2 border-amber-100 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Nom</label>
                  <input type="text" value={stage.nom} onChange={(e) => setStage({ ...stage, nom: e.target.value })} className="w-full p-3 bg-white border border-amber-100 rounded-2xl outline-none text-amber-900 text-sm shadow-sm" placeholder="Nom" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Prénom</label>
                  <input type="text" value={stage.prenom} onChange={(e) => setStage({ ...stage, prenom: e.target.value })} className="w-full p-3 bg-white border border-amber-100 rounded-2xl outline-none text-amber-900 text-sm shadow-sm" placeholder="Prénom" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Début</label>
                  <input type="date" value={stage.dateDebut} onChange={(e) => setStage({ ...stage, dateDebut: e.target.value })} className="w-full p-3 bg-white border border-amber-100 rounded-2xl outline-none text-amber-900 text-xs shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Fin</label>
                  <input type="date" value={stage.dateFin} onChange={(e) => setStage({ ...stage, dateFin: e.target.value })} className="w-full p-3 bg-white border border-amber-100 rounded-2xl outline-none text-amber-900 text-xs shadow-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Lieu de stage</label>
                <input type="text" value={stage.lieu} onChange={(e) => setStage({ ...stage, lieu: e.target.value })} placeholder="Entreprise de menuiserie..." className="w-full p-3 bg-white border border-amber-100 rounded-2xl outline-none text-amber-900 text-sm shadow-sm" />
              </div>
            </div>

            <div className="mt-6 w-full flex flex-col gap-3 no-print">
              <button onClick={exportPDF} className="flex items-center justify-center gap-2 p-4 bg-amber-800 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">
                <FileText size={22} /> Générer le PDF final
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => saveStageInternal()} className="flex flex-col items-center gap-1 p-3 bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-200 font-bold active:bg-emerald-200 transition-colors">
                  <Save size={20} /> <span>Sauver</span>
                </button>
                <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center gap-1 p-3 bg-amber-100 text-amber-800 rounded-2xl border border-amber-200 font-bold active:bg-amber-200 transition-colors">
                  <Menu size={20} /> <span>Menu</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPage > 0 && currentPage <= 10 && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Journal quotidien</span>
                <h2 className="text-3xl font-black text-amber-900 uppercase">Jour {currentPage}</h2>
                {/* Affichage de la date calculée en dessous du jour */}
                <p className="text-xs font-bold text-amber-500 italic mt-1 flex items-center gap-1 capitalize">
                   <Calendar size={14} /> {getWorkingDayLabel(stage.dateDebut, currentPage - 1)}
                </p>
              </div>
              <div className="flex flex-col gap-2 no-print">
                 <button onClick={() => setCurrentPage(0)} className="flex items-center gap-2 p-3 bg-white text-amber-800 rounded-xl shadow-sm border border-amber-100 active:bg-amber-50 text-xs font-bold">
                  <Home size={16} /> Accueil
                 </button>
                 <button onClick={() => saveStageInternal()} className="flex items-center gap-2 p-3 bg-emerald-600 text-white rounded-xl shadow-md active:scale-95 text-xs font-bold">
                  <Save size={16} /> Sauver
                 </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col mb-6 min-h-[180px] bg-amber-50/30 p-5 rounded-3xl border-2 border-dashed border-amber-200 shadow-inner">
              <label className="text-[10px] font-black text-amber-700 uppercase mb-3 block">Travaux réalisés aujourd'hui</label>
              <textarea
                value={stage.entries[currentPage - 1].description}
                onChange={(e) => {
                  const newEntries = [...stage.entries];
                  newEntries[currentPage - 1].description = e.target.value;
                  setStage({ ...stage, entries: newEntries });
                }}
                className="flex-1 w-full p-4 bg-white border border-amber-100 rounded-2xl outline-none resize-none text-amber-900 text-sm leading-relaxed shadow-sm"
                placeholder="Explique tes tâches, les machines utilisées..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-2">
              {stage.entries[currentPage - 1].photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden border-2 border-white shadow-xl group">
                  <img src={photo} alt="Travail menuiserie" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(currentPage - 1, idx)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl no-print shadow-lg hover:scale-110 transition-transform">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {stage.entries[currentPage - 1].photos.length < 2 && (
                <label className="aspect-square rounded-3xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center bg-amber-50/50 active:bg-amber-100 transition-all no-print shadow-sm cursor-pointer">
                  <Camera size={32} className="text-amber-400 mb-2" />
                  <span className="text-[10px] text-amber-600 font-black uppercase text-center px-2">Ajouter Photo</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(currentPage - 1, e)} />
                </label>
              )}
            </div>
          </div>
        )}

        {currentPage === 11 && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar pb-10">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-amber-900 uppercase">Auto-évaluation</h2>
              <div className="flex flex-col gap-2 no-print">
                 <button onClick={() => setCurrentPage(0)} className="flex items-center gap-2 p-2 bg-white text-amber-800 rounded-xl shadow-sm border border-amber-100 text-xs font-bold">
                  <Home size={16} /> Accueil
                 </button>
                 <button onClick={() => saveStageInternal()} className="flex items-center gap-2 p-2 bg-emerald-600 text-white rounded-xl shadow-md text-xs font-bold">
                  <Save size={16} /> Sauver
                 </button>
              </div>
            </div>
            <div className="space-y-4">
              {EVAL_POINTS.map((point, idx) => (
                <div key={idx} className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm">
                  <p className="text-sm font-bold text-amber-900 mb-4">{idx + 1}. {point}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {EVAL_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleEvalChange(idx, opt)}
                        className={`p-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${stage.evaluation[idx] === opt ? 'bg-amber-600 border-amber-700 text-white shadow-md' : 'bg-amber-50/30 border-amber-50 text-amber-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 12 && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar pb-10">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-amber-900 uppercase">Bilan Final</h2>
              <div className="flex flex-col gap-2 no-print">
                 <button onClick={() => setCurrentPage(0)} className="flex items-center gap-2 p-2 bg-white text-amber-800 rounded-xl shadow-sm border border-amber-100 text-xs font-bold">
                  <Home size={16} /> Accueil
                 </button>
                 <button onClick={() => saveStageInternal()} className="flex items-center gap-2 p-2 bg-emerald-600 text-white rounded-xl shadow-md text-xs font-bold">
                  <Save size={16} /> Sauver
                 </button>
              </div>
            </div>
            <div className="space-y-5">
              {EVAL_TEXT_POINTS.map((point) => (
                <div key={point.id} className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm">
                  <label className="text-sm font-black text-amber-900 block mb-3">{point.id}. {point.label}</label>
                  <textarea
                    value={stage.evalComments[point.id] || ''}
                    onChange={(e) => handleCommentChange(point.id, e.target.value)}
                    className="w-full p-4 bg-amber-50/20 border border-amber-100 rounded-2xl outline-none text-sm text-amber-800 italic shadow-inner"
                    rows={4}
                    placeholder="Ton ressenti personnel..."
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-8 no-print pb-4">
              <button onClick={exportPDF} className="w-full flex items-center justify-center gap-3 p-5 bg-amber-800 text-white rounded-[2rem] font-black uppercase shadow-2xl active:scale-95 transition-all">
                <FileText size={28} /> Finaliser et télécharger le PDF
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="h-24 bg-[#fdf8f1] border-t-2 border-amber-900/10 flex items-center justify-between px-8 no-print shrink-0 relative shadow-inner">
        <div className="absolute top-0 left-0 right-0 h-1 flex justify-between px-4 opacity-30 pointer-events-none">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className={`bg-amber-900 ${i % 5 === 0 ? 'h-4 w-[2px]' : 'h-2 w-[1px]'}`}></div>
          ))}
        </div>

        <button
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          className={`p-3 transition-all ${currentPage === 0 ? 'opacity-10 cursor-not-allowed' : 'text-amber-800 active:scale-75'}`}
        >
          <ChevronLeft size={36} strokeWidth={3} />
        </button>

        <div className="flex gap-1.5 items-center">
          {Array.from({ length: 13 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${currentPage === i ? 'bg-amber-600 w-6 shadow-md' : 'bg-amber-200 w-2.5 hover:bg-amber-300'}`}
            />
          ))}
        </div>

        <button
          disabled={currentPage === 12}
          onClick={() => setCurrentPage(p => Math.min(12, p + 1))}
          className={`p-3 transition-all ${currentPage === 12 ? 'opacity-10 cursor-not-allowed' : 'text-amber-800 active:scale-75'}`}
        >
          <ChevronRight size={36} strokeWidth={3} />
        </button>
      </footer>
    </div>
  );
};

export default App;
