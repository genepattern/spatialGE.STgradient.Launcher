import { param, run, poll_job } from '../visualizer/genepattern/visualizer_utils.js'

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
                    };
                    document.querySelector('#annotation').addEventListener('change', annotation_change);
                    annotation_change();
                });
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
        async handle_submit() {
            if (!this.validate()) return;

           $('#form-collapse').collapse('hide');
           $('#results-collapse').removeClass('d-none');

            document.getElementById('job-status').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting';
            let job = await run('spatialGE.STgradient',
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
                ]);

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

console.log('-----------------------------')
console.log('window.location')
console.log(window.location)
console.log('window.parent.location')
console.log(window.parent.location)
console.log('document.referrer')
console.log(document.referrer)
console.log('document.location.href')
console.log(document.location.href)