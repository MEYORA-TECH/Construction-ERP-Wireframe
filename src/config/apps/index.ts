import type { AppConfig } from '../types';
import { billingApp } from './billing';
import { claimsApp } from './claims';
import { contractsApp } from './contracts';
import { crmApp } from './crm';
import { equipmentApp } from './equipment';
import { estimationApp } from './estimation';
import { financeApp } from './finance';
import { handoverApp } from './handover';
import { landApp } from './land';
import { procurementApp } from './procurement';
import { projectApp } from './project';
import { qualitySafetyApp } from './qualitySafety';
import { reportingApp } from './reporting';
import { siteApp } from './site';
import { storeApp } from './store';
import { subcontractApp } from './subcontract';
import { tenderApp } from './tender';
import { variationsApp } from './variations';
import { workforceApp } from './workforce';

/** All 19 applications in switcher / lifecycle order (matches the client brief). */
export const APPS: AppConfig[] = [
  crmApp,
  tenderApp,
  landApp,
  estimationApp,
  projectApp,
  procurementApp,
  storeApp,
  siteApp,
  subcontractApp,
  equipmentApp,
  workforceApp,
  contractsApp,
  billingApp,
  financeApp,
  qualitySafetyApp,
  handoverApp,
  variationsApp,
  claimsApp,
  reportingApp,
];
