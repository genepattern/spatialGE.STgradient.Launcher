import { param, run, poll_job, auth_token } from '../visualizer/genepattern/visualizer_utils.js';

async function write_session(job_id, session_content, filename='session.json') {
    try {
        return await fetch(`/gp/rest/v1/data/upload/job_output?jobid=${job_id}&name=${filename}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'GenePatternRest',
                'Authorization': `Bearer ${auth_token()}`
            },
            body: JSON.stringify(session_content)
        }).then(response => response.json());
    }
    catch (e) {
        console.error('Unable to write session.json');
        return null;
    }
}

async function fetch_session(job_id) {
    const session_url = `/gp/jobResults/${job_id}/session.json`;
    const session = await fetch(session_url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${auth_token()}`
        }
    });
    if (session.ok) return await session.json()
    else return false;
}

async function fetch_job(job_id) {
    return fetch(`/gp/rest/v1/jobs/${job_id}/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GenePatternRest',
            'Authorization': `Bearer ${auth_token()}`
        }
    }).then(response => response.json())
}

Vue.createApp({
    data() {
        return {
            samples: [],
            samplesSelected: [],
            annotations: [],
            referenceClusterRange: [],
            excludeClusterRange: [],
            distanceSummaryOptions: {
                'Minimum distance': 'min',
                'Average distance': 'avg'
            },
            form: {
                samples: [],
                numVariableGenes: 3000,
                annotationToTest: '',
                referenceCluster: null,
                excludeClusters: null,
                robustRegression: true,
                ignoreOutliers: false,
                correlationLimit: null,
                minNeighbors: 3,
                distanceSummary: 'min'
            }
        };
    },
    created: function() {
        this.fetch_session();
        this.fetch_samples();
        this.fetch_domains();
    },
    watch: {
        'form.robustRegression'(newValue) {
            if (newValue) {
                this.form.ignoreOutliers = false;
            }
        }
    },
    methods: {
        error_message(message) {
            setTimeout(() => {
                const error_box = document.getElementById('error');
                error_box.innerHTML = message;
                error_box.classList.remove('d-none');
            }, 100);
        },
        toggle_samples() {
            const selected = document.getElementById('check-all')?.checked;
            this.samples.forEach(item => (item.selected = selected));
        },
        async fetch_session() {
            const launcher_job_id = param('job.id');
            if (!launcher_job_id) return false;
            else {
                const session = await fetch_session(launcher_job_id);
                if (session) {
                    const reload_button = document.querySelector('#reload-session');
                    reload_button.addEventListener('click', () => {
                        this.handle_submit(null, session.job);
                    });
                    reload_button.classList.remove('d-none');
                }

                return true;
            }

        },
        fetch_samples() {
            let samples_url = param('sample.info');
            if (!samples_url) {
                samples_url = 'data/samples.json';
                this.error_message('Unable to get sample.info parameter\'s value');
            }

            fetch(samples_url)
                .then(r => r.json())
                .then(r => {
                    this.samples = r;
                    document.getElementById('sample-loading').classList.add('d-none');
                    setTimeout(() => {
                        const slider_max = Math.max(...this.samples.map(s => s.max_genes));
                        document.getElementById('numVariableGenesSlider')?.setAttribute('max', slider_max);
                    }, 100);
                });
        },
        fetch_domains() {
            let domains_url = param('domain.info');
            if (!domains_url) {
                domains_url = 'data/annotations.json';
                this.error_message('Unable to get domain.info parameter\'s value');
            }

            fetch(domains_url)
                .then(r => r.json())
                .then(r => {
                    this.annotations = r.annotation_variables;
                    this.form.annotationToTest = r.annotation_variables?.[0]?.value;

                    const annotation_change = () => {
                        const matching = [];
                        for (const i of r.annotation_variables_clusters)
                            if (i.annotation === this.form.annotationToTest)
                                matching.push(i);

                        this.referenceClusterRange = matching;
                        this.form.referenceCluster = matching?.[0]?.value;
                        this.excludeClusterRange = ['', ...matching];
                        this.form.excludeClusters = null;
                        this.show_thumbs(r.image_paths);
                    };
                    document.querySelector('#annotation').addEventListener('change', annotation_change);
                    annotation_change();
                });
        },
        show_thumbs(image_paths) {
            const thumbs_node = document.getElementById('thumbs');
            if (thumbs_node) thumbs_node.innerHTML = '';
            if (!image_paths || !image_paths.length) return;
            
            for (const i of image_paths)
                if (i.includes(this.form.annotationToTest)) {
                    const image_name = i.substring(i.lastIndexOf('/')+1, 
                        i.indexOf(this.form.annotationToTest)).replace(/_$/, "");
                    
                    const thumbnail = document.createElement('img');
                    thumbnail.setAttribute('src', i);
                    thumbnail.classList.add('img-thumbnail');
                    thumbnail.setAttribute('title', image_name);

                    const link = document.createElement('a');
                    link.setAttribute('href', i);
                    link.setAttribute('target', '_BLANK');
                    link.appendChild(thumbnail);
                    
                    thumbs_node.appendChild(link);
                    $('#thumbs img').tooltip({placement: 'top'});
                }
        },
        checked_samples() {
            const checks = document.getElementById('samples')
                .querySelectorAll('tbody input[type=checkbox]:checked');
            const names = [];
            checks.forEach(element => {
                if (element.hasAttribute('name')) {
                    names.push(element.getAttribute('name'));
                }
            });
            return names.join(',');
        },
        validate() {
            // Placeholder for custom validation, for now rely on browser default
            return true;
        },
        async handle_submit(event, job_id=null) {
            if (!job_id) if (!this.validate()) return;

           $('#form-collapse').collapse('hide');
           $('#results-collapse').removeClass('d-none');

            const initial_status = job_id ? 'Loading' : 'Submitting';
            document.getElementById('job-status').innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${initial_status}`;
            let job = !job_id ? await run('spatialGE.STgradient',
                [
                    {'name': 'input.file', 'values': [param('dataset')]},
                    {'name': 'samples', 'values': [this.checked_samples()]},
                    {'name': 'num.variable.genes', 'values': [this.form.numVariableGenes]},
                    {'name': 'annotation.to.test', 'values': [this.form.annotationToTest]},
                    {'name': 'reference.cluster', 'values': [this.form.referenceCluster]},
                    {'name': 'exclude.clusters', 'values': [this.form.excludeClusters]},
                    {'name': 'robust.regression', 'values': [this.form.robustRegression ? 'True': 'False']},
                    {'name': 'ignore.outliers', 'values': [this.form.ignoreOutliers ? 'True': 'False']},
                    {'name': 'correlation.limit', 'values': [this.form.correlationLimit]},
                    {'name': 'min.neighbors', 'values': [this.form.minNeighbors]},
                    {'name': 'distance.summary', 'values': [this.form.distanceSummary]}
                ]) :
                await fetch_job(job_id);

            // Write session file
            if (!job_id) {
                let launcher_job_id = param('job.id');
                if (launcher_job_id) await write_session(launcher_job_id, {job: job.jobId});
            }

            // Poll for completion
            job = await poll_job(job, update => {
                let status = '<i class="fa-solid fa-spinner fa-spin"></i> ';
                if      (update.status.hasError)   status =  'Error';
                else if (update.status.isFinished) status =  'Complete';
                else if (update.status.isPending)  status += 'Pending';
                else                               status += 'Running';

                document.getElementById('job-status').innerHTML = status;
            });

            window.send_to_stplot = (url) => {
                if (window.parent.location && window.parent.location.hostname && 
                    window.parent.location.hostname === window.location.hostname) window.open(url);
                else {
                    const instructions = $(`
                        <div class="modal fade" id="stplot-modal" tabindex="-1" role="dialog" aria-hidden="true">
                          <div class="modal-dialog" role="document">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h5 class="modal-title">Send to STplot</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                  <span aria-hidden="true">&times;</span>
                                </button>
                              </div>
                              <div class="modal-body">
                                To send your results to STplot, drag and drop the link for your <strong>rds</strong> file onto the <code>input.file</code> parameter of the <strong>spatialGE.STplot.Launcher</strong> module.
                              </div>
                              <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                              </div>
                            </div>
                          </div>
                        </div>
                    `).appendTo('body')
                    $(instructions).modal()
                };
            }

            // Show the job results
            let result_html = `<table class="table table-sm table-striped">
                                  <thead>
                                    <tr>
                                      <th scope="col">File</th>
                                      <th scope="col">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>`;
            for (const result of job.outputFiles) {
                if (result.link.href.endsWith('.rds')) result_html += `
                                    <tr><td><a href="Javascript:send_to_stplot('${result.link.href}')" target="_blank">${result.link.name}</a></td>
                                        <td><a href="/gp/pages/index.jsf?lsid=spatialGE.STplot.Launcher&input.file=${encodeURIComponent(result.link.href)}" target="_blank" class="btn btn-primary btn-sm">Send to STplot</a>`;
                else result_html += `<tr><td>${result.link.name}</td>
                                        <td>
                                            <a href="${result.link.href}?download" target="_blank" class="btn btn-secondary btn-sm">Download</a> 
                                            <a href="Javascript:window.open('${result.link.href}');" class="btn btn-secondary btn-sm">Open in New Tab</a></td></tr>`;
                console.log(result);
            }
            result_html += "</tbody></table>";
            document.getElementById('job-results').innerHTML = result_html;
        }
    }
}).mount('#app');
