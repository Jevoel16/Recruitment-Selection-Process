document.addEventListener('DOMContentLoaded', () => {
    const usersTab = document.getElementById('users-tab');
    const logsTab = document.getElementById('logs-tab');

    if (usersTab) {
        usersTab.addEventListener('show.bs.tab', fetchUsers);
        document.getElementById('createUserForm').addEventListener('submit', createUser);
        document.getElementById('editUserForm').addEventListener('submit', updateUser);
        
        document.getElementById('createUserModal').addEventListener('hidden.bs.modal', function () {
            document.getElementById('createUserForm').reset();
        });

        if (usersTab.classList.contains('active')) {
            fetchUsers();
        }

        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                let visibleCount = 0;
                document.querySelectorAll('#usersTable tbody tr:not(#noUsersRow)').forEach(row => {
                    const text = row.textContent.toLowerCase();
                    const isVisible = text.includes(query);
                    row.style.display = isVisible ? '' : 'none';
                    if (isVisible) visibleCount++;
                });

                const tbody = document.querySelector('#usersTable tbody');
                let noUsersRow = document.getElementById('noUsersRow');
                const countEl = document.getElementById('userResultCount');
                if (countEl) countEl.textContent = query ? `${visibleCount} matching user${visibleCount === 1 ? '' : 's'}` : '';

                if (visibleCount === 0) {
                    if (!noUsersRow) {
                        tbody.insertAdjacentHTML('beforeend', `
                            <tr id="noUsersRow">
                                <td colspan="5" class="text-center py-5 text-muted">
                                    <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                                    No users found matching the criteria.
                                </td>
                            </tr>
                        `);
                    } else {
                        noUsersRow.style.display = '';
                    }
                } else if (noUsersRow) {
                    noUsersRow.style.display = 'none';
                }
            });
        }

        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = this.querySelector('i');
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                icon.classList.replace(show ? 'bi-eye' : 'bi-eye-slash', show ? 'bi-eye-slash' : 'bi-eye');
                this.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
                this.setAttribute('aria-pressed', String(show));
            });
        });
    }

    if (logsTab) {
        logsTab.addEventListener('show.bs.tab', fetchLogs);
        if (logsTab.classList.contains('active')) {
            fetchLogs();
        }
    }
});

// Shared message row for the users/logs tables (loading, empty and error states)
function tableMessageRow(colspan, message, { id = '', icon = 'bi-inbox', loading = false } = {}) {
    const visual = loading
        ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>'
        : `<i class="bi ${icon} fs-1 d-block mb-2 text-secondary opacity-50" aria-hidden="true"></i>`;
    return `<tr${id ? ` id="${id}"` : ''}><td colspan="${colspan}" class="text-center py-5 text-muted">${visual}${escapeHtml(message)}</td></tr>`;
}

async function readError(res, fallback) {
    try {
        const body = await res.json();
        return body.error || body.message || fallback;
    } catch (e) {
        return fallback;
    }
}

// Same rule as the server: 8+ characters with at least one letter and one number
function isStrongPassword(password) {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

async function fetchUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = tableMessageRow(5, 'Loading users...', { loading: true });
    try {
        const signal = window.getTabAbortSignal ? window.getTabAbortSignal() : undefined;
        const response = await fetch('/api/users', { signal });
        if (!response.ok) throw new Error(await readError(response, 'Could not load users.'));
        const users = await response.json();

        let html = '';
        if (users.length === 0) {
            html = tableMessageRow(5, 'No users found matching the criteria.', { id: 'noUsersRow' });
        } else {
            users.forEach(user => {
                html += `
                    <tr>
                        <td>${escapeHtml(user.name)}</td>
                        <td>${escapeHtml(user.username)}</td>
                        <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${escapeHtml(user.role)}</span></td>
                        <td>${user.can_access_step2 ? '<i class="bi bi-check-circle-fill text-success" aria-hidden="true"></i> Yes' : '<i class="bi bi-x-circle-fill text-danger" aria-hidden="true"></i> No'}</td>
                        <td class="text-center pe-4 ps-3 text-nowrap">
                            <div class="d-flex justify-content-center align-items-center gap-2">
                                <button class="btn btn-sm btn-outline-primary action-btn shadow-sm px-2 py-1" onclick="openEditUser(${user.id}, ${jsArg(user.role)}, ${user.can_access_step2 ? 'true' : 'false'})" aria-label="Edit ${escapeHtml(user.username)}"><i class="bi bi-pencil" aria-hidden="true"></i> Edit</button>
                                <button class="btn btn-sm btn-outline-danger action-btn shadow-sm px-2 py-1" onclick="deleteUser(${user.id})" aria-label="Delete ${escapeHtml(user.username)}"><i class="bi bi-trash" aria-hidden="true"></i> Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        tbody.innerHTML = html;

        // Re-apply search filter if there's an active search query
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput && searchInput.value) {
            searchInput.dispatchEvent(new Event('input'));
        }
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.error(e);
        tbody.innerHTML = tableMessageRow(5, e.message || 'Could not load users.', { icon: 'bi-exclamation-triangle' });
    }
}

async function createUser(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.can_access_step2 = formData.get('can_access_step2') === 'on';

    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'warning');
        return;
    }
    if (!isStrongPassword(password)) {
        showToast('Password must be at least 8 characters long and contain at least one letter and one number.', 'warning');
        return;
    }

    const btn = document.getElementById('createUserBtn');
    setButtonLoading(btn, true, 'Creating...');
    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
            e.target.reset();
            fetchUsers();
            showToast('User successfully created!', 'success');
        } else {
            showToast(await readError(res, 'Could not create the user.'), 'danger');
        }
    } catch (err) {
        console.error(err);
        showToast('Network error. Please try again.', 'danger');
    } finally {
        setButtonLoading(btn, false);
    }
}

function openEditUser(id, role, can_access_step2) {
    document.getElementById('editUserForm').reset();
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserRole').value = role;
    document.getElementById('editAccessStep2').checked = can_access_step2;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editUserModal')).show();
}

async function updateUser(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = document.getElementById('editUserId').value;

    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password) {
        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'warning');
            return;
        }
        if (!isStrongPassword(password)) {
            showToast('Password must be at least 8 characters long and contain at least one letter and one number.', 'warning');
            return;
        }
    }

    const data = {
        role: formData.get('role'),
        can_access_step2: formData.get('can_access_step2') === 'on',
        password: password || undefined
    };

    const btn = document.getElementById('editUserBtn');
    setButtonLoading(btn, true, 'Saving...');
    try {
        const res = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            e.target.reset();
            fetchUsers();
            showToast('User updated.', 'success');
        } else {
            showToast(await readError(res, 'Could not update the user.'), 'danger');
        }
    } catch (err) {
        console.error(err);
        showToast('Network error. Please try again.', 'danger');
    } finally {
        setButtonLoading(btn, false);
    }
}

function deleteUser(id) {
    document.getElementById('deleteUserId').value = id;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteUserModal')).show();
}

async function executeDeleteUser() {
    const id = document.getElementById('deleteUserId').value;
    const btn = document.getElementById('deleteUserBtn');
    setButtonLoading(btn, true, 'Deleting...');
    try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('deleteUserModal')).hide();
            fetchUsers();
            showToast('User deleted.', 'success');
        } else {
            showToast(await readError(res, 'Could not delete the user.'), 'danger');
        }
    } catch (err) {
        console.error(err);
        showToast('Network error. Please try again.', 'danger');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function fetchLogs() {
    const tbody = document.querySelector('#logsTable tbody');
    const colspan = document.querySelectorAll('#logsTable thead th').length || 3;
    tbody.innerHTML = tableMessageRow(colspan, 'Loading logs...', { loading: true });
    try {
        const signal = window.getTabAbortSignal ? window.getTabAbortSignal() : undefined;
        const response = await fetch('/api/logs', { signal });
        if (!response.ok) throw new Error(await readError(response, 'Could not load logs.'));
        const logs = await response.json();

        if (logs.length === 0) {
            tbody.innerHTML = tableMessageRow(colspan, 'No activity has been logged yet.');
            return;
        }
        tbody.innerHTML = logs.map(log => `
                <tr>
                    <td><small class="text-muted">${escapeHtml(new Date(log.createdAt).toLocaleString())}</small></td>
                    <td><strong>${escapeHtml(log.name)}</strong> <br><small class="text-muted">@${escapeHtml(log.username)}</small></td>
                    <td>${escapeHtml(log.action)}</td>
                </tr>
            `).join('');
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.error(e);
        tbody.innerHTML = tableMessageRow(colspan, e.message || 'Could not load logs.', { icon: 'bi-exclamation-triangle' });
    }
}
