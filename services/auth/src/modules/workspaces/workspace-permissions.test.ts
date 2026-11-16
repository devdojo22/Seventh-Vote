import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Role } from '@prisma/client';
import type { WorkspacePermissions } from '../../shared/types/api.types.js';
import { permissionsFor, type WorkspaceGrant } from './workspace-permissions.js';

const EVERYTHING: WorkspacePermissions = {
  manageMembers: true,
  configureWorkspace: true,
  viewDossiers: true,
  editDossiers: true,
  approveDossiers: true,
  runRehearsals: true,
  viewResults: true,
};

function member(role: Role, canEditDossiers: boolean, canApproveDossiers: boolean): WorkspaceGrant {
  return { kind: 'member', role, canEditDossiers, canApproveDossiers };
}

void test('a super-admin always has every permission, approveDossiers included', () => {
  assert.deepEqual(permissionsFor({ kind: 'platform-operator' }), EVERYTHING);
});

void test('a Principal always has every permission, whatever the membership flags say', () => {
  for (const edit of [false, true]) {
    for (const approve of [false, true]) {
      assert.deepEqual(permissionsFor(member(Role.PRINCIPAL, edit, approve)), EVERYTHING);
    }
  }
});

void test('an Affiliate gets approveDossiers only from canApproveDossiers', () => {
  assert.equal(permissionsFor(member(Role.AFFILIATE, false, false)).approveDossiers, false);
  assert.equal(permissionsFor(member(Role.AFFILIATE, true, false)).approveDossiers, false);
  assert.equal(permissionsFor(member(Role.AFFILIATE, false, true)).approveDossiers, true);
  assert.equal(permissionsFor(member(Role.AFFILIATE, true, true)).approveDossiers, true);
});

void test('an Affiliate keeps the existing permissions, with editDossiers from canEditDossiers', () => {
  for (const edit of [false, true]) {
    for (const approve of [false, true]) {
      assert.deepEqual(permissionsFor(member(Role.AFFILIATE, edit, approve)), {
        manageMembers: false,
        configureWorkspace: false,
        viewDossiers: true,
        editDossiers: edit,
        approveDossiers: approve,
        runRehearsals: true,
        viewResults: true,
      });
    }
  }
});
