# spatialGE.STgradient (v1)

The `spatialGE.STgradient` module is part of the spatialGE package. It  tests for genes for which there is evidence of 
expression spatial gradients with respect to a “reference” tissue niche/domain (e.g., higher expression closer to 
reference tissue niche, lower expression as farther from reference tissue niche).

## Module Details

- **Authors:** Thorin Tabor; UCSD - Mesirov Lab
- **Categories:** spatial transcriptomics
- **Source repository:** [spatialGE.Preprocessing on GitHub](https://github.com/genepattern/spatialGE.STgradient)
- **Contact**: [GenePattern Help Forum](https://groups.google.com/forum/?utm_medium=email&utm_source=footer#!forum/genepattern-help)
- **Algorithm Version**: [spatialGE 1.2.0](https://fridleylab.github.io/spatialGE/)

## Summary

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
* [spatialGE.STgradient source repository](https://github.com/genepattern/spatialGE.STgradient/)

## Parameters

| Name                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Default Value |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| input file *         | Normalized spatial transcriptomics data with clusters, coming from the spatialGE.STclust module.                                                                                                                                                                                                                                                                                                                                                                                                                           |               |
| num variable genes * | Maximum number of genes per sample to test for spatial gradients. The genes to be tested are selected based on standard deviation.                                                                                                                                                                                                                                                                                                                                                                                         | 3000          |
| robust regression *  | In robust regression, outliers are given less weight towards the calculation of the regression coefficient.                                                                                                                                                                                                                                                                                                                                                                                                                | True          |
| ignore outliers *    | Whether to ignore outliers. This option is ignored if robust regression is selected. If outliers are ignored, traditional linear regression is carried out after removing spots/cells defined as outliers by the interquartile range method. If set to false, all spots are considered in the analysis.                                                                                                                                                                                                                    | False         |
| correlation limit    | A distance value to restrict the correlation analysis. Some tissues can be very heterogeneous in composition. As a result it could be reasonable to test for spatial gradients within a restricted area of the tissue.                                                                                                                                                                                                                                                                                                     |               |
| min neighbors *      | The minimum number of immediate neighbors a reference spot/cell must have to be included in the analysis. This parameter intends to reduce the effect of isolated spots/cells in the calculation of the correlation coefficients. Unsupervised clustering algorithms (such as STclust) can assign niches to isolated spots. Reference spots with less neighbors than specified, will be omitted from the analysis, and hence distances from that spot will not be calculated.                                              | 3             |
| distance summary *   | Distance summary metric: 'average' or 'minimum'                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Minimum       |
| samples              | Comma-separated list of sample names to include. If left blank, all samples will be used.                                                                                                                                                                                                                                                                                                                                                                                                                                  |               |
| annotation to test   | The tissue niches on which to run STgradient. This parameter should be set to the name of a column in @spatial_meta containing the tissue domain assignments for each spot or cell. These are generated by STclust. If left blank, STgradient will be run for all tissue niches.                                                                                                                                                                                                                                           |               |
| reference cluster    | Reference cluster from which spatial gradients are to be tested. The reference cluster could be, for example, a tumor region detected by STclust. One of the tissue domains in the niche specified in annotation to test. Corresponds to the "reference" cluster or domain. Spearman's correlations will be calculated using spots assigned to domains other than this reference domain (or domains specified in exclude clusters). If left blank, values will be individually calculated for all possible tissue domains. |               |
| exclude clusters     | Comma-separated list of clusters to exclude. Exclude regions/niches from the analysis. By specifying one or more niches, the distances of those spots/cells will not be calculated and will be excluded from the analyses. This option could be useful when removing tissue niches that show necrosis and could add noise to the Spearman's coefficients.                                                                                                                                                                  |               |

\*  required

## Input Files
1. input.file  
   Accepts an RDS file containing a normalized STlist object and clustering data, such as output by the [spatialGE.STclust](https://github.com/genepattern/spatialGE.STclust) module.

    
## Output Files
1. **\*.csv**  
   Each row of the output CSV files represents a test for the null hypothesis of no spatial aggregation in the expression of the set in the “gene_set” column. The column “size_test” is the number of genes of a gene set that were present in the FOV. The larger this number the better, as it indicates a better representation of the gene set in the sample. The “adj_p_value” is the multiple test adjusted p-value, which is the value used to decide if a gene set shows significant indications of a spatial pattern (adj_p_value < 0.05).
2. **genes_in_fov.png**  
    A visual summary of the gene sets with an adjusted p-value below the specified threshold and with the number of genes of a gene set that were present in the FOV being equal to or greater than the specified proportion.

## Example Data

Input:  
[lung.rds](https://github.com/genepattern/spatialGE.STgradient/blob/main/data/lung.rds)

## Requirements

Requires the [genepattern/spatialge-stgradient:0.1 Docker image](https://hub.docker.com/layers/genepattern/spatialge-stgradient/0.4/images/sha256-11d9de50d721c27fd02edd8f65f0bd17fe4d5e8ea7c99b13236b8daf092c2c10?context=explore).

## License

`spatialGE.STgradient` is distributed under a BSD-style license available at [https://github.com/genepattern/spatialGE.STgradient/blob/main/LICENSE.](https://github.com/genepattern/spatialGE.STgradient/blob/main/LICENSE)

## Version Comments

| Version | Release Date      | Description     |
|---------|-------------------|-----------------|
| 1       | November 25, 2024 | Initial version |
