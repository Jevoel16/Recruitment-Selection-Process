/**
 * Standard Pagination Helper
 * Used to paginate arrays or DOM elements uniformly across the application.
 */
const PaginationHelper = {
    instances: {},

    /**
     * Paginate an array of items.
     * @param {string} id - Unique identifier for the pagination instance
     * @param {Array} items - The array of items to paginate
     * @param {number} itemsPerPage - Number of items per page
     * @param {function} renderCallback - Callback function(paginatedItems, currentPage, totalPages)
     * @param {boolean} resetPage - Whether to reset to page 1
     */
    paginateArray: function(id, items, itemsPerPage, renderCallback, resetPage = false, containerId = null) {
        if (!this.instances[id] || resetPage) {
            this.instances[id] = { page: 1 };
        }
        
        let state = this.instances[id];
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        
        if (state.page > totalPages) state.page = totalPages;
        if (state.page < 1) state.page = 1;
        
        const startIndex = (state.page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = items.slice(startIndex, endIndex);
        
        renderCallback(paginatedItems, state.page, totalPages);
        
        if (containerId) {
            this.renderNumberedPagination(containerId, state.page, totalPages, (pageNum) => {
                this.instances[id].page = pageNum;
                this.paginateArray(id, items, itemsPerPage, renderCallback, false, containerId);
            });
        }
    },

    /**
     * Paginate DOM elements.
     * @param {string} id - Unique identifier for the pagination instance
     * @param {NodeList|Array} elements - The DOM elements to paginate (should already be filtered for search)
     * @param {number} itemsPerPage - Number of items per page
     * @param {Object} uiControls - Object containing UI element IDs { pageLabelId, prevBtnId, nextBtnId, containerId }
     * @param {boolean} resetPage - Whether to reset to page 1
     */
    paginateDOM: function(id, elements, itemsPerPage, containerId, resetPage = false) {
        if (!this.instances[id] || resetPage) {
            this.instances[id] = { page: 1 };
        }
        
        let state = this.instances[id];
        const allItems = Array.from(elements);
        const totalItems = allItems.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        
        if (state.page > totalPages) state.page = totalPages;
        if (state.page < 1) state.page = 1;
        
        const startIndex = (state.page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Hide all elements
        allItems.forEach(el => el.style.display = 'none');
        // Show only the elements for the current page
        allItems.slice(startIndex, endIndex).forEach(el => el.style.display = '');
        
        if (containerId) {
            this.renderNumberedPagination(containerId, state.page, totalPages, (pageNum) => {
                this.instances[id].page = pageNum;
                this.paginateDOM(id, elements, itemsPerPage, containerId, false);
            });
        }
    },
    
    /**
     * Renders a numbered pagination UI (e.g. 1 2 3 ... 10)
     * @param {string} containerId - The ID of the container element
     * @param {number} currentPage - The current page
     * @param {number} totalPages - The total number of pages
     * @param {function} onPageClick - Callback function for when a page is clicked. If it returns a string, it's used as the href. Otherwise, it is an onclick handler.
     */
    renderNumberedPagination: function(containerId, currentPage, totalPages, onPageClick) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        if (totalPages <= 1) return;
        
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Page navigation');
        nav.className = 'mt-4';
        
        const ul = document.createElement('ul');
        ul.className = 'pagination flex-wrap justify-content-center mb-0';
        
        const createEllipsis = () => {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<span class="page-link border-0 bg-transparent text-muted">...</span>';
            return li;
        };
        
        const createLi = (text, pageNum, active, isFirst, isLast) => {
            const li = document.createElement('li');
            li.className = `page-item ${active ? 'active' : ''}`;
            const a = document.createElement('a');
            
            let extraClasses = 'rounded-circle';
            if (isFirst) extraClasses = 'page-first';
            else if (isLast) extraClasses = 'page-last';
            
            a.className = `page-link mx-1 ${active ? 'shadow-sm' : ''} ${extraClasses}`;
            
            let action;
            if (typeof onPageClick === 'function') {
                if (onPageClick.length === 0) { // If function doesn't take parameters, it might just return href
                    action = onPageClick(pageNum);
                }
            }
            
            // if we are provided a callback that we should execute
            a.href = 'javascript:void(0)';
            if (!active) {
                a.onclick = (e) => {
                    e.preventDefault();
                    if (typeof onPageClick === 'function') onPageClick(pageNum, e);
                };
            }
            
            a.innerHTML = text;
            li.appendChild(a);
            return li;
        };

        const paginationList = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                paginationList.push({ page: i, isCurrent: i === currentPage });
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                paginationList.push({ isEllipsis: true });
            }
        }

        const cleanPagination = paginationList.filter((p, index, arr) => {
            if (p.isEllipsis && arr[index - 1] && arr[index - 1].isEllipsis) return false;
            return true;
        });

        cleanPagination.forEach((p, index) => {
            if (p.isEllipsis) {
                ul.appendChild(createEllipsis());
            } else {
                const isFirst = index === 0;
                const isLast = index === cleanPagination.length - 1;
                ul.appendChild(createLi(p.page, p.page, p.isCurrent, isFirst, isLast));
            }
        });
        
        nav.appendChild(ul);
        container.appendChild(nav);
    },
    
    /**
     * Change the page of a specific pagination instance.
     * @param {string} id - Unique identifier for the pagination instance
     * @param {number} delta - The amount to change the page by (e.g., -1 for previous, 1 for next)
     * @param {function} callback - Callback function to re-render the paginated content
     */
    changePage: function(id, delta, callback) {
        if (this.instances[id]) {
            this.instances[id].page += delta;
            if (typeof callback === 'function') callback();
        }
    }
};
