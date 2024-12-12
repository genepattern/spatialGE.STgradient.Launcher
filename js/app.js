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
                        this.excludeClusterRange = matching;
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



            // Show the job results
            let result_html = "<div class='alert alert-info'><h3>STgradient Results</h3><ul>";
            for (const result of job.outputFiles) {
                result_html += `<li><a href="${result.link.href}" target="_self">${result.link.name}</a></li>`;
                console.log(result);
            }
            result_html += "</ul></div>";
            document.getElementById('job-results').innerHTML = result_html;
        }
    }
}).mount('#app');