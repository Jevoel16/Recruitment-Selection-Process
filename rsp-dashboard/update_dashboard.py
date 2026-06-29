import os
import re

dir_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\views'
hbs_path = os.path.join(dir_path, 'dashboard.hbs')

with open(hbs_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''    <!-- Dashboard Tabs -->
    <ul class="nav nav-pills mb-4 gap-2" id="dashboardTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link {{#unless selectedPosition}}active{{/unless}} fw-bold px-4 py-2 rounded-pill shadow-sm" id="metrics-tab" data-bs-toggle="pill" data-bs-target="#metrics" type="button" role="tab"><i class="bi bi-graph-up me-2"></i> Metrics</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link fw-bold px-4 py-2 rounded-pill shadow-sm {{#if selectedPosition}}active{{/if}}" id="categories-tab" data-bs-toggle="pill" data-bs-target="#categories" type="button" role="tab"><i class="bi bi-diagram-3 me-2"></i> Position Categories</button>
        </li>
    </ul>

    <div class="tab-content" id="dashboardTabsContent">
        <!-- Metrics Tab -->
        <div class="tab-pane fade {{#unless selectedPosition}}show active{{/unless}}" id="metrics" role="tabpanel">
            <div class="row g-4 mb-4">
                <div class="col-md-12">
                    <div class="card border-0 glass-panel shadow-sm rounded-4 h-100" style="background: linear-gradient(135deg, rgba(13,110,253,0.1) 0%, rgba(13,110,253,0.05) 100%); border-left: 5px solid #0d6efd !important;">
                        <div class="card-body p-4 d-flex align-items-center">
                            <div class="display-4 text-primary fw-bold me-4"><i class="bi bi-briefcase-fill"></i></div>
                            <div>
                                <h3 class="fw-bold mb-1">{{totalVacantCount}} / {{totalPositionsCount}}</h3>
                                <p class="text-muted mb-0">Total Vacant Positions Across All Categories</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <h5 class="fw-bold mb-3 text-muted"><i class="bi bi-bar-chart-fill me-2"></i>Vacancies per Category</h5>
            <div class="row g-4">
                {{#each groupedPositions}}
                <div class="col-md-6 col-lg-3">
                    <div class="card border-0 glass-panel shadow-sm rounded-4 h-100 p-2 {{#if this.hasVacancy}}border-start border-4 border-success{{else}}border-start border-4 border-secondary opacity-75{{/if}}" style="transition: transform 0.2s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div class="card-body p-2">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="fw-bold mb-0 text-truncate" title="{{this.categoryName}}">{{this.categoryName}}</h6>
                                <span class="badge {{#if this.hasVacancy}}bg-success{{else}}bg-secondary{{/if}} rounded-pill" style="font-size: 0.7rem;">
                                    {{#if this.hasVacancy}}Active{{else}}No Vacancy{{/if}}
                                </span>
                            </div>
                            <div class="mt-4 d-flex align-items-end justify-content-between">
                                <div>
                                    <h2 class="fw-bold mb-0 {{#if this.hasVacancy}}text-success{{else}}text-muted{{/if}}">{{this.vacantCount}}</h2>
                                    <small class="text-muted">Vacant / {{this.totalCount}} Total</small>
                                </div>
                                <i class="bi bi-pie-chart-fill fs-2 text-muted opacity-25"></i>
                            </div>
                        </div>
                    </div>
                </div>
                {{/each}}
            </div>
        </div>

        <!-- Categories Tab -->
        <div class="tab-pane fade {{#if selectedPosition}}show active{{/if}}" id="categories" role="tabpanel">
            <div class="row">
                <!-- Categories and Positions List -->'''

new_content = content.replace('    <div class="row">\n        <!-- Categories and Positions List -->', replacement)

# Finally, ensure that the tab-content div is closed right before the `</div> <!-- End container-fluid -->` 
new_content = new_content.replace('    </div>\n</div> <!-- End container-fluid -->', '            </div>\n        </div>\n    </div>\n</div> <!-- End container-fluid -->')

with open(hbs_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated dashboard.hbs successfully.")
