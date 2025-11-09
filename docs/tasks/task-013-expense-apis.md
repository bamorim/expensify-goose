# Task: Implement expense submission APIs

## Meta Information

- **Task ID**: `TASK-013`
- **Title**: Implement expense submission APIs
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-11-09
- **Updated**: 2025-11-09
- **Estimated Effort**: 4 hours
- **Actual Effort**: 0 hours

## Related Documents

- **PRD**: [docs/product/prd-main.md](../product/prd-main.md)
- **Dependencies**: TASK-012, TASK-010

## Description

Implement tRPC procedures for expense submission with policy validation, automatic approval/rejection, and workflow initiation.

## Acceptance Criteria

- [ ] createExpense with policy validation
- [ ] Automatic approval for policy-compliant expenses
- [ ] Auto-rejection for expenses over limits
- [ ] Manual review routing based on policy
- [ ] getExpenses with filtering and pagination
- [ ] getExpense with full details and history
- [ ] update/delete for draft expenses only

## TODOs

- [ ] Create expense tRPC router
- [ ] Implement policy validation in createExpense
- [ ] Implement automatic approval logic
- [ ] Implement auto-rejection logic
- [ ] Implement manual review routing
- [ ] Create getExpenses with filtering
- [ ] Create getExpense with history
- [ ] Implement update/delete for drafts
- [ ] Add comprehensive input validation
- [ ] Write unit and integration tests

## Progress Updates

### 2025-11-09 - goose
**Status**: Not Started
**Progress**: Task created for core expense functionality
**Blockers**: TASK-012, TASK-010 must be completed first
**Next Steps**: Start after expense model and policy resolution are ready

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Policy integration working correctly
- [ ] Automatic workflows tested end-to-end

---

**Template Version**: 1.0
**Last Updated**: 2025-11-09
