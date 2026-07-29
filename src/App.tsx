import React, { useState, useEffect } from 'react';
import { AppData, TabType } from './types';
import { Language } from './utils/i18n';
import { loadData, saveData, loadMonthSnapshot, saveMonthSnapshot } from './utils/storage';
import { saveAccountData, getActiveAccountId } from './utils/accounts';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MonthSplashModal } from './components/MonthSplashModal';
import { LoginModal } from './components/LoginModal';
import { HomeTab } from './components/HomeTab';
import { VisitsTab } from './components/VisitsTab';
import { AbsencesTab } from './components/AbsencesTab';
import { PupilsTab } from './components/PupilsTab';
import { AnimateursTab } from './components/AnimateursTab';
import { EcolesTab } from './components/EcolesTab';
import { ScheduleTab } from './components/ScheduleTab';
import { ReportsTab } from './components/ReportsTab';

import {
  VisitModal,
  EvaluationModal,
  NotesModal,
  GroupsModal,
  AddEditAnimModal,
  AddEditEcoleModal,
  AddEditGroupeModal,
  AddSlotModal,
  EditGroupeScheduleModal,
  BulkAbsenceModal,
  AddReportModal,
  GistSettingsModal,
  CloudSettingsModal,
  SupervisorModal,
} from './components/Modals';

export default function App() {
  const [db, setDb] = useState<AppData>(() => loadData());
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [lang, setLang] = useState<Language>('ar');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Month Splash state
  const [isMonthSplashOpen, setIsMonthSplashOpen] = useState<boolean>(false);

  // Supervisor Profile Modal state
  const [supervisorModal, setSupervisorModal] = useState<boolean>(false);

  // Modal States
  const [visitModal, setVisitModal] = useState<{ isOpen: boolean; animId: number }>({
    isOpen: false,
    animId: 1,
  });
  const [evalModal, setEvalModal] = useState<{ isOpen: boolean; animId: number }>({
    isOpen: false,
    animId: 1,
  });
  const [notesModal, setNotesModal] = useState<{ isOpen: boolean; animId: number }>({
    isOpen: false,
    animId: 1,
  });
  const [groupsModal, setGroupsModal] = useState<{ isOpen: boolean; animId: number }>({
    isOpen: false,
    animId: 1,
  });
  const [addEditAnimModal, setAddEditAnimModal] = useState<{ isOpen: boolean; animId?: number }>({
    isOpen: false,
  });
  const [addEditEcoleModal, setAddEditEcoleModal] = useState<{ isOpen: boolean; ecoleId?: number }>({
    isOpen: false,
  });
  const [addEditGroupeModal, setAddEditGroupeModal] = useState<{
    isOpen: boolean;
    groupeId?: number;
    animIdForNew?: number;
    ecoleNomForNew?: string;
  }>({
    isOpen: false,
  });
  const [addSlotModal, setAddSlotModal] = useState<{
    isOpen: boolean;
    animId: number;
    defDay?: string;
    defTime?: string;
  }>({
    isOpen: false,
    animId: 1,
  });
  const [editGroupeScheduleModal, setEditGroupeScheduleModal] = useState<{
    isOpen: boolean;
    groupeId: number;
  }>({
    isOpen: false,
    groupeId: 1,
  });
  const [bulkAbsenceModal, setBulkAbsenceModal] = useState<boolean>(false);
  const [addReportModal, setAddReportModal] = useState<boolean>(false);
  const [gistSettingsModal, setGistSettingsModal] = useState<boolean>(false);
  const [cloudSettingsModal, setCloudSettingsModal] = useState<boolean>(false);

  // Sync state changes with localStorage and supervisor account workspace
  useEffect(() => {
    saveAccountData(getActiveAccountId(), db);
  }, [db]);

  const handleUpdateDb = (updater: (prev: AppData) => AppData) => {
    setDb((prev) => updater(prev));
  };

  // Toggle Language
  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'fr' : 'ar'));
  };

  // Month change
  const handleSelectMonth = (month: number) => {
    setDb((prev) => {
      const snapSaved = saveMonthSnapshot(prev, prev.currentMonth);
      const loaded = loadMonthSnapshot(snapSaved, month);
      return loaded;
    });
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl relative overflow-x-hidden font-['Cairo',sans-serif]"
    >
      {/* Header */}
      <Header
        db={db}
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenMonthSelector={() => setIsMonthSplashOpen(true)}
        onOpenSupervisorModal={() => setSupervisorModal(true)}
        onLockApp={() => setIsLoggedIn(false)}
      />

      {/* Main Content View */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'home' && (
          <HomeTab
            db={db}
            lang={lang}
            onNavigateTab={setCurrentTab}
            onQuickVisit={(animId) => setVisitModal({ isOpen: true, animId })}
            onOpenSupervisorModal={() => setSupervisorModal(true)}
            onOpenAddAnimModal={() => setAddEditAnimModal({ isOpen: true })}
            onOpenAddEcoleModal={() => setAddEditEcoleModal({ isOpen: true })}
          />
        )}

        {currentTab === 'visits' && (
          <VisitsTab
            db={db}
            lang={lang}
            onUpdateDb={handleUpdateDb}
            onOpenVisitModal={(animId) => setVisitModal({ isOpen: true, animId })}
          />
        )}

        {currentTab === 'absences' && (
          <AbsencesTab
            db={db}
            lang={lang}
            onUpdateDb={handleUpdateDb}
            onOpenBulkAbsenceModal={() => setBulkAbsenceModal(true)}
          />
        )}

        {currentTab === 'pupils' && <PupilsTab db={db} lang={lang} onUpdateDb={handleUpdateDb} />}

        {currentTab === 'animateurs' && (
          <AnimateursTab
            db={db}
            lang={lang}
            onUpdateDb={handleUpdateDb}
            onOpenVisitModal={(animId) => setVisitModal({ isOpen: true, animId })}
            onOpenEvalModal={(animId) => setEvalModal({ isOpen: true, animId })}
            onOpenNotesModal={(animId) => setNotesModal({ isOpen: true, animId })}
            onOpenGroupsModal={(animId) => setGroupsModal({ isOpen: true, animId })}
            onOpenEditAnimModal={(animId) => setAddEditAnimModal({ isOpen: true, animId })}
            onOpenAddAnimModal={() => setAddEditAnimModal({ isOpen: true })}
          />
        )}

        {currentTab === 'ecoles' && (
          <EcolesTab
            db={db}
            lang={lang}
            onUpdateDb={handleUpdateDb}
            onOpenAddEcoleModal={() => setAddEditEcoleModal({ isOpen: true })}
            onOpenEditEcoleModal={(ecoleId) => setAddEditEcoleModal({ isOpen: true, ecoleId })}
            onOpenAddGroupeToEcoleModal={(ecoleNom) =>
              setAddEditGroupeModal({ isOpen: true, ecoleNomForNew: ecoleNom })
            }
            onOpenEditGroupeModal={(groupeId) => setAddEditGroupeModal({ isOpen: true, groupeId })}
          />
        )}

        {currentTab === 'schedule' && (
          <ScheduleTab
            db={db}
            lang={lang}
            onOpenAddSlotModal={(animId, defDay, defTime) =>
              setAddSlotModal({ isOpen: true, animId, defDay, defTime })
            }
            onOpenEditGroupeScheduleModal={(groupeId) =>
              setEditGroupeScheduleModal({ isOpen: true, groupeId })
            }
          />
        )}

        {currentTab === 'reports' && (
          <ReportsTab
            db={db}
            lang={lang}
            onUpdateDb={handleUpdateDb}
            onOpenGistSettings={() => setGistSettingsModal(true)}
            onOpenCloudSettings={() => setCloudSettingsModal(true)}
            onOpenAddVisitModal={() =>
              setVisitModal({ isOpen: true, animId: db.animateurs[0]?.id || 1 })
            }
            onOpenAddReportModal={() => setAddReportModal(true)}
            onOpenBulkAbsenceModal={() => setBulkAbsenceModal(true)}
          />
        )}
      </main>

      {/* Navigation */}
      <Navigation currentTab={currentTab} lang={lang} onSelectTab={setCurrentTab} />


      {/* Month Selector Splash Modal */}
      <MonthSplashModal
        currentMonth={db.currentMonth}
        isOpen={isMonthSplashOpen}
        onClose={() => setIsMonthSplashOpen(false)}
        onSelectMonth={handleSelectMonth}
      />

      {/* Supervisor Account & Project Modal */}
      <SupervisorModal
        isOpen={supervisorModal}
        onClose={() => setSupervisorModal(false)}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      {/* Dialog Modals */}
      <VisitModal
        isOpen={visitModal.isOpen}
        onClose={() => setVisitModal((p) => ({ ...p, isOpen: false }))}
        animId={visitModal.animId}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <EvaluationModal
        isOpen={evalModal.isOpen}
        onClose={() => setEvalModal((p) => ({ ...p, isOpen: false }))}
        animId={evalModal.animId}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <NotesModal
        isOpen={notesModal.isOpen}
        onClose={() => setNotesModal((p) => ({ ...p, isOpen: false }))}
        animId={notesModal.animId}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <GroupsModal
        isOpen={groupsModal.isOpen}
        onClose={() => setGroupsModal((p) => ({ ...p, isOpen: false }))}
        animId={groupsModal.animId}
        db={db}
        onUpdateDb={handleUpdateDb}
        onOpenAddGroupeModal={(animId) => setAddEditGroupeModal({ isOpen: true, animIdForNew: animId })}
        onOpenEditGroupeModal={(groupeId) => setAddEditGroupeModal({ isOpen: true, groupeId })}
      />

      <AddEditAnimModal
        isOpen={addEditAnimModal.isOpen}
        onClose={() => setAddEditAnimModal((p) => ({ ...p, isOpen: false }))}
        animId={addEditAnimModal.animId}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <AddEditEcoleModal
        isOpen={addEditEcoleModal.isOpen}
        onClose={() => setAddEditEcoleModal((p) => ({ ...p, isOpen: false }))}
        ecoleId={addEditEcoleModal.ecoleId}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <AddEditGroupeModal
        isOpen={addEditGroupeModal.isOpen}
        onClose={() => setAddEditGroupeModal((p) => ({ ...p, isOpen: false }))}
        groupeId={addEditGroupeModal.groupeId}
        animIdForNew={addEditGroupeModal.animIdForNew}
        ecoleNomForNew={addEditGroupeModal.ecoleNomForNew}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <AddSlotModal
        isOpen={addSlotModal.isOpen}
        onClose={() => setAddSlotModal((p) => ({ ...p, isOpen: false }))}
        animId={addSlotModal.animId}
        defDay={addSlotModal.defDay}
        defTime={addSlotModal.defTime}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <EditGroupeScheduleModal
        isOpen={editGroupeScheduleModal.isOpen}
        onClose={() => setEditGroupeScheduleModal((p) => ({ ...p, isOpen: false }))}
        groupeId={editGroupeScheduleModal.groupeId}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <BulkAbsenceModal
        isOpen={bulkAbsenceModal}
        onClose={() => setBulkAbsenceModal(false)}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <AddReportModal
        isOpen={addReportModal}
        onClose={() => setAddReportModal(false)}
        db={db}
        onUpdateDb={handleUpdateDb}
      />

      <GistSettingsModal
        isOpen={gistSettingsModal}
        onClose={() => setGistSettingsModal(false)}
      />

      <CloudSettingsModal
        isOpen={cloudSettingsModal}
        onClose={() => setCloudSettingsModal(false)}
      />

      {/* Login / Authentication Modal */}
      {!isLoggedIn && (
        <LoginModal
          db={db}
          lang={lang}
          onLoginSuccess={(_account, loadedDb) => {
            setDb(loadedDb);
            setIsLoggedIn(true);
          }}
        />
      )}
    </div>
  );
}
