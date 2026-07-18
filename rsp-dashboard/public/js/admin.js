document.addEventListener('DOMContentLoaded', () => {
    const usersTab = document.getElementById('users-tab');
    const logsTab = document.getElementById('logs-tab');

    if (usersTab) {
        usersTab.addEventListener('shown.bs.tab', fetchUsers);
        document.getElementById('createUserForm').addEventListener('submit', createUser);
        document.getElementById('editUserForm').addEventListener('submit', updateUser);
        
        document.getElementById('createUserModal').addEventListener('hidden.bs.modal', function () {
            document.getElementById('createUserForm').reset();
        });

        if (usersTab.classList.contains('active')) {
            fetchUsers();
        }
    }

    if (logsTab) {
        logsTab.addEventListener('shown.bs.tab', fetchLogs);
        if (logsTab.classList.contains('active')) {
            fetchLogs();
        }
    }
});

async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            tbody.innerHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.username}</td>
                    <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role}</span></td>
                    <td>${user.can_access_step2 ? '<i class="bi bi-check-circle-fill text-success"></i> Yes' : '<i class="bi bi-x-circle-fill text-danger"></i> No'}</td>
                    <td class="text-center pe-4 ps-3 text-nowrap">
                        <div class="d-flex justify-content-center align-items-center gap-2">
                            <button class="btn btn-sm btn-warning action-btn text-dark shadow-sm px-2 py-1" onclick="openEditUser(${user.id}, '${user.role}', ${user.can_access_step2})" title="Edit User"><i class="bi bi-pencil"></i> Edit</button>
                            <button class="btn btn-sm btn-danger action-btn shadow-sm px-2 py-1" onclick="deleteUser(${user.id})" title="Delete User"><i class="bi bi-trash"></i> Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

async function createUser(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.can_access_step2 = formData.get('can_access_step2') === 'on';

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
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (e) {
        console.error(e);
    }
}

function openEditUser(id, role, can_access_step2) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserRole').value = role;
    document.getElementById('editAccessStep2').checked = can_access_step2;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editUserModal')).show();
}

async function updateUser(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = document.getElementById('editUserId').value;
    const data = {
        role: formData.get('role'),
        can_access_step2: formData.get('can_access_step2') === 'on',
        password: formData.get('password') || undefined
    };

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
        } else {
            alert('Error updating user');
        }
    } catch (e) {
        console.error(e);
    }
}

function deleteUser(id) {
    document.getElementById('deleteUserId').value = id;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteUserModal')).show();
}

async function executeDeleteUser() {
    const id = document.getElementById('deleteUserId').value;
    try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('deleteUserModal')).hide();
            fetchUsers();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (e) {
        console.error(e);
    }
}

async function fetchLogs() {
    try {
        const response = await fetch('/api/logs');
        const logs = await response.json();
        const tbody = document.querySelector('#logsTable tbody');
        tbody.innerHTML = '';
        
        logs.forEach(log => {
            const date = new Date(log.createdAt).toLocaleString();
            tbody.innerHTML += `
                <tr>
                    <td><small class="text-muted">${date}</small></td>
                    <td><strong>${log.name}</strong> <br><small class="text-muted">@${log.username}</small></td>
                    <td>${log.action}</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}
