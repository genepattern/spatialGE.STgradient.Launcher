# spatialGE.STgradient.Launcher (v1)

The `spatialGE.STgradient.Launcher` module is part of the spatialGE package. It reads the output of `spatialGE.STclust` and then
launches an analysis to test for genes for which there is evidence of expression spatial gradients with respect to a 
"reference" tissue niche/domain (e.g., higher expression closer to reference tissue niche, lower expression as farther 
from reference tissue niche).

## Module Details

- **Authors:** Thorin Tabor; UCSD - Mesirov Lab
- **Categories:** spatial transcriptomics, javascript
- **Source repository:** [spatialGE.Preprocessing.Launcher on GitHub](https://github.com/genepattern/spatialGE.STgradient.Launcher)
- **Contact**: [GenePattern Help Forum](https://groups.google.com/forum/?utm_medium=email&utm_source=footer#!forum/genepattern-help)
- **Algorithm Version**: [spatialGE 1.2.0](https://fridleylab.github.io/spatialGE/)

## Summary

`spatialGE.STgradient.Launcher` is used to read the results of `spatialGE.STclust` and then launch an STgradient analysis. Once the analysis is complete, then displays the results for the user to download or send to `spatialGE.STplot.Launcher` for further visualization.

[STgradient](https://fridleylab.github.io/spatialGE/) tests for genes for which there is evidence of expression spatial 
gradients with respect to a “reference” tissue niche/domain (e.g., higher expression closer to reference tissue niche, 
lower expression as farther from reference tissue niche).

The method calculates distances from each spot/cell to the reference tissue niche/domain (e.g., a cluster defined via
STclust) and correlates those distances with gene expression values from top variable genes (defined by standard
deviation across ROIs/spots/cells). The distances to reference niche can be summarized using the average or the minimum
value. Generally, the minimum distances might be better to capture gradients at short ranges, while average distances
capture whole-tissue gradients. The use of robust regression to reduce (albeit not eliminate) the effect of zero
inflation in spatial transcriptomics data.

Spearman correlation coefficients are calculated using the ‘cor.test’ R function. The most variable genes to be tested
are identified before removal of outliers.

This module accepts an RDS file containing a normalized STlist object and clustering data, such as output by the [spatialGE.STclust](https://github.com/genepattern/spatialGE.STclust) module.

## References

Ospina, O. E., Wilson C. M., Soupir, A. C., Berglund, A. Smalley, I., Tsai, K. Y., Fridley, B. L. 2022. spatialGE: quantification and visualization of the tumor microenvironment heterogeneity using spatial transcriptomics. Bioinformatics, 38:2645-2647. https://doi.org/10.1093/bioinformatics/btac145

## Source Links
* [spatialGE.STgradient.Launcher source repository](https://github.com/genepattern/spatialGE.STgradient.Launcher/)

## Parameters

| Name               | Description                                                                                                         | Default Value |
|--------------------|---------------------------------------------------------------------------------------------------------------------|---------------|
| dataset *          | Normalized spatial transcriptomics data with clusters, coming from the spatialGE.STclust module.                    |               |
| sample info *      | JSON file containing spot/cell and gene statistics for each sample, coming from the spatialGE.Preprocessing module. |               |
| domain info *      | JSON file containing domain/cluster statistics for each sample, coming from the spatialGE.STclust module.           |               |                                                                                                                                              |               |

\*  required

## Input Files
1. dataset  
   Accepts an RDS file containing a normalized STlist object and clustering data, such as output by the [spatialGE.STclust](https://github.com/genepattern/spatialGE.STclust) module.

    
## Output Files
1. **\*.csv**  
   Each row of the output CSV files represents a test for the null hypothesis of no spatial aggregation in the expression of the set in the “gene_set” column. The column “size_test” is the number of genes of a gene set that were present in the FOV. The larger this number the better, as it indicates a better representation of the gene set in the sample. The “adj_p_value” is the multiple test adjusted p-value, which is the value used to decide if a gene set shows significant indications of a spatial pattern (adj_p_value < 0.05).
2. **dataset.rds**  
   Accepts an RDS file containing a normalized STlist object and clustering data, along with the new gradient data.

## Example Data

Input:  
[lung.rds](https://github.com/genepattern/spatialGE.STgradient/blob/main/data/lung.rds)

## License

`spatialGE.STgradient` is distributed under a BSD-style license available at [https://github.com/genepattern/spatialGE.STgradient/blob/main/LICENSE.](https://github.com/genepattern/spatialGE.STgradient/blob/main/LICENSE)

## Version Comments

| Version | Release Date      | Description     |
|---------|-------------------|-----------------|
| 1       | December 16, 2024 | Initial version |
