import { auth_token, param } from '../visualizer/genepattern/visualizer_utils.mjs'

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
            let samples_url = param('samples.info');
            if (!samples_url) {
                samples_url = 'data/samples.json';
                this.error_message('Unable to get samples.info parameter\'s value');
            }

            fetch(samples_url)
                .then(r => r.json())
                .then(r => {
                    this.samples = r;
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
        validate() {
            // TODO
        },
        handle_submit() {
            console.log(this.form);

            // let job = await run(url())
            //
            // // Poll for completion
            // job = await poll(job);
            //
            // // Get the output data
            // const odata = await output(job);
            //
            // // Display file once complete
            // document.getElementById('output-file').innerHTML = output_url(job);
            // document.getElementById('output-preview').innerHTML = odata;
        }
    }
}).mount('#app');