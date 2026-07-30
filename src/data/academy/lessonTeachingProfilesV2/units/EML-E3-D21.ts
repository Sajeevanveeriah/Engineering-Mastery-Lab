import {
  ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
  type AcademyDomainConditionTuple,
  type AcademyDomainEntityTuple,
  type AcademyDomainRelationTuple,
  type AcademyDomainTermTuple,
  type AcademyLessonTeachingProfileV2Registry
} from "../../lessonTeachingProfileV2";
import {
  academyLessonV2TextRef,
  materialiseAcademyLessonTeachingProfileV2Registry,
  type AcademyLessonTeachingProfileV2CompactPlan,
  type AcademyLessonV2InstructionPlan
} from "../../lessonTeachingProfileV2Authoring";
import {
  expandAcademyLessonTeachingProfileV2Seed
} from "../../lessonTeachingProfileV2Validation";

type CaseSource = Readonly<{
  scenario: string;
  givenLabel: string;
  givenValue: string;
  givenUnit: string | null;
  reasoning: readonly [string, string, string];
  outcome: string;
  criterion: string;
  verification: string;
}>;

type LessonSource = Readonly<{
  lessonId: string;
  instructionMarker: string;
  systemModel: string;
  failurePattern: string;
  visualExplanation: string;
  applicationTask: string;
  terms: readonly [
    readonly [string, string, string],
    readonly [string, string, string],
    readonly [string, string, string]
  ];
  entities: readonly [
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string],
    readonly [AcademyDomainEntityTuple[1], string, string]
  ];
  relations: readonly [
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ],
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ],
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ],
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ],
    readonly [
      AcademyDomainRelationTuple[1],
      string,
      AcademyDomainRelationTuple[5],
      AcademyDomainRelationTuple[6]
    ]
  ];
  conditions: readonly [
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string],
    readonly [AcademyDomainConditionTuple[1], string]
  ];
  failure: readonly [string, string, string];
  conceptualSteps: readonly [string, string, string, string, string];
  example: CaseSource;
  counterexample: CaseSource;
  misconception: Readonly<{
    claim: string;
    mechanism: string;
    correction: string;
    disconfirmingObservation: string;
  }>;
  assessmentMoves: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];
  variant: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}>;

const lessonSources = [
  {
    "lessonId": "EML-E3-D21-L01",
    "instructionMarker": "ray projection ledger",
    "systemModel": "A camera maps rays from three-dimensional scene points through a lens and exposure model onto two-dimensional sensor coordinates governed by focal length, principal point, depth and perspective.",
    "failurePattern": "Pixel position cannot be treated as physical position when depth, lens distortion, camera pose, image scale or exposure conditions are unknown.",
    "visualExplanation": "A scene point connects by a ray through the camera centre to the image plane, with camera axes, depth, focal length, principal point and the resulting pixel labelled.",
    "applicationTask": "Project several known camera-frame points into an image, vary focal length or depth and verify the direction and scale of the predicted pixel motion.",
    "terms": [
      [
        "Pinhole model",
        "An ideal geometric model in which each scene ray passes through one camera centre before intersecting the image plane.",
        "It explains perspective but omits lens distortion, blur, finite aperture and sensor timing."
      ],
      [
        "Camera intrinsics",
        "Parameters mapping camera-frame rays to pixels, including focal lengths and principal point.",
        "Intrinsics belong to a particular image size, crop, focus and calibration state."
      ],
      [
        "Perspective projection",
        "The depth-dependent mapping that divides camera-frame lateral coordinates by forward depth before pixel scaling.",
        "Points at zero or negative camera depth are not ordinary visible image points."
      ]
    ],
    "entities": [
      [
        "input",
        "Camera-frame scene point",
        "A three-dimensional point with metres, axis convention and positive forward depth."
      ],
      [
        "mechanism",
        "Intrinsic projection model",
        "Perspective division followed by focal-length and principal-point scaling."
      ],
      [
        "state",
        "Predicted image coordinate",
        "The ideal pixel location associated with the scene ray."
      ],
      [
        "observation",
        "Known-point reprojection",
        "Observed marker pixels compared with model-projected positions."
      ],
      [
        "decision",
        "Accepted camera model",
        "The projection assumptions retained for the stated camera configuration."
      ]
    ],
    "relations": [
      [
        "maps",
        "the camera-frame scene point maps into the intrinsic projection model",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the intrinsic projection model transforms a scene ray into a predicted image coordinate",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "depth focal length and principal point cause the predicted image coordinate",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "known-point reprojection supports the accepted camera model",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "wrong depth sign or changed image scaling invalidates the accepted camera model",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Camera axes, point frame, length units, image size, pixel origin and intrinsic parameter convention are declared."
      ],
      [
        "assumption",
        "The ideal pinhole relation is adequate before distortion and timing effects are introduced."
      ],
      [
        "criterion",
        "Projected known points agree with observed pixels across depth and image position within tolerance."
      ],
      [
        "operating-state",
        "The altered case crops or rescales the image while reusing intrinsics from the original resolution."
      ]
    ],
    "failure": [
      "A pixel coordinate is converted to a physical offset using focal length while point depth and image scaling are omitted.",
      "The calculation returns finite pixels but observed points shift systematically after resize or depth change.",
      "Reject the projection until frame, depth, image geometry and known-point reprojection agree."
    ],
    "conceptualSteps": [
      "Declare the camera frame, image axes, pixel origin and units for every scene point and intrinsic value.",
      "Check that the point has positive forward depth in the camera frame.",
      "Apply perspective division before pixel scaling and principal-point offset.",
      "Project known points spanning depth and image position and inspect signed residuals.",
      "Challenge the model after any crop, resize, focus or camera-configuration change."
    ],
    "example": {
      "scenario": "A marker with known camera-frame coordinates is projected into a full-resolution image using calibrated focal lengths and principal point.",
      "givenLabel": "Known projection case",
      "givenValue": "camera-frame point, intrinsics and observed marker pixel",
      "givenUnit": null,
      "reasoning": [
        "Confirm the point uses the calibrated camera axes and has positive forward depth.",
        "Divide lateral coordinates by depth, then apply pixel focal lengths and principal-point offsets.",
        "Compare the predicted pixel with the independently detected marker and record signed residuals."
      ],
      "outcome": "The projected and observed pixel positions agree within the declared ideal-model tolerance.",
      "criterion": "Horizontal and vertical residuals must pass across multiple depths and image regions.",
      "verification": "Move the marker farther away and confirm its displacement from the principal point changes in the predicted direction."
    },
    "counterexample": {
      "scenario": "A half-resolution image is processed with intrinsics calibrated for the original full-resolution image.",
      "givenLabel": "Mismatched image scale",
      "givenValue": "resized pixels with unscaled focal lengths and principal point",
      "givenUnit": null,
      "reasoning": [
        "The altered image changes the numerical pixel coordinate system.",
        "Unscaled intrinsics still predict coordinates in the original pixel geometry.",
        "Residuals therefore grow with distance from the image origin or principal point."
      ],
      "outcome": "Projected points appear systematically displaced despite correct three-dimensional geometry.",
      "criterion": "Intrinsics and pixel measurements must describe the same image size and crop.",
      "verification": "Scale the intrinsic parameters consistently and compare the residual pattern before and after correction."
    },
    "misconception": {
      "claim": "A pixel tells you where an object is in space.",
      "mechanism": "The projection ray is mistaken for a unique three-dimensional point and depth is silently assumed.",
      "correction": "Treat one pixel as a camera ray until depth or additional geometry is supplied.",
      "disconfirmingObservation": "Many points at different distances along the same camera ray project to the same ideal pixel."
    },
    "assessmentMoves": [
      "sequencing a scene ray into pixel coordinates",
      "recovering from mismatched image scaling",
      "screening a camera model through known-point projection",
      "diagnosing residual direction from intrinsic mismatch",
      "explaining a pixel ray apart from a spatial point",
      "matching intrinsic parameters to image geometry",
      "reading camera point projection and residual together",
      "revealing one pixel with many possible depths"
    ],
    "variant": 0
  },
  {
    "lessonId": "EML-E3-D21-L02",
    "instructionMarker": "pixel treatment register",
    "systemModel": "Pixels sample intensity in channels, colour spaces reorganise those channels and spatial filters combine neighbouring samples to alter noise, edges and detail.",
    "failurePattern": "A colour threshold or filter tuned on one image can erase features, shift apparent brightness or fail under changed illumination, bit depth or channel order.",
    "visualExplanation": "One image patch expands into channel values and a filter kernel, then compares noisy, smoothed, edge-preserved and colour-space outputs with the original.",
    "applicationTask": "Apply or analyse two filters and two colour representations on a noisy image, then quantify both noise change and retained edge contrast.",
    "terms": [
      [
        "Pixel",
        "A sampled image location storing one or more channel values at a declared bit depth.",
        "A pixel is an area sample, not a dimensionless point or direct physical colour measurement."
      ],
      [
        "Colour space",
        "A coordinate system for representing colour or intensity information in channels.",
        "Channel meaning and numeric range differ across RGB, HSV, greyscale and other representations."
      ],
      [
        "Convolution filter",
        "A weighted neighbourhood operation producing each output value from nearby input pixels.",
        "Kernel size, boundary handling, normalisation and data type affect the result."
      ]
    ],
    "entities": [
      [
        "input",
        "Typed image array",
        "Pixels with width, height, channel order, bit depth and numeric range."
      ],
      [
        "mechanism",
        "Colour and neighbourhood transform",
        "Colour conversion and spatial filtering with declared kernels and boundaries."
      ],
      [
        "state",
        "Processed image representation",
        "The transformed channels and local structure used by later vision stages."
      ],
      [
        "observation",
        "Noise-edge comparison",
        "Measured noise variation and edge contrast before and after processing."
      ],
      [
        "decision",
        "Accepted preprocessing choice",
        "The colour and filter pipeline retained for the target visual condition."
      ]
    ],
    "relations": [
      [
        "maps",
        "the typed image array maps into the colour and neighbourhood transform",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the colour and neighbourhood transform transforms channels into a processed image representation",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "kernel channel order and numeric range cause noise and edge changes",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "noise-edge comparison supports the accepted preprocessing choice",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "illumination shift or channel mismatch invalidates the accepted preprocessing choice",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Image size, channel order, colour space, bit depth, numeric range, kernel and border rule are declared."
      ],
      [
        "assumption",
        "The retained image set spans the illumination and noise expected for the preprocessing decision."
      ],
      [
        "criterion",
        "Noise reduction and feature retention both meet declared measures on held-out images."
      ],
      [
        "operating-state",
        "The altered case changes illumination colour or supplies RGB data to code expecting BGR order."
      ]
    ],
    "failure": [
      "Preprocessing is selected from one visually pleasing output without measuring the downstream feature it must preserve.",
      "Noise falls but target edges or colours shift outside the detector's valid range.",
      "Reject the pipeline until typed-array semantics, held-out illumination and both noise and feature criteria pass."
    ],
    "conceptualSteps": [
      "Inspect image shape, channel order, bit depth and numeric range before any transform.",
      "Choose a colour representation whose channel meaning matches the intended visual distinction.",
      "Apply a declared filter and border rule while preserving a copy of the original evidence.",
      "Measure noise and target-edge or colour separation rather than judging appearance alone.",
      "Repeat on held-out lighting and reject processing that improves one measure by destroying the other."
    ],
    "example": {
      "scenario": "A robot camera observes a coloured marker with sensor noise under two representative lighting levels.",
      "givenLabel": "Marker preprocessing set",
      "givenValue": "typed colour images, marker mask and background regions",
      "givenUnit": null,
      "reasoning": [
        "Confirm channel order and convert images to a representation separating hue-like and brightness-like information.",
        "Apply a bounded smoothing filter and measure background variation and marker-edge contrast.",
        "Choose parameters that retain the marker boundary on held-out images while reducing irrelevant noise."
      ],
      "outcome": "The processed images reduce noise without erasing the marker edge or collapsing colour separation.",
      "criterion": "Both background variation and held-out marker-detection measures must satisfy their thresholds.",
      "verification": "Change kernel size once in each direction and explain the measured trade-off rather than relying on appearance."
    },
    "counterexample": {
      "scenario": "A large averaging kernel is applied before detecting a thin cable against a noisy floor.",
      "givenLabel": "Over-smoothed feature",
      "givenValue": "thin target width smaller than the smoothing neighbourhood",
      "givenUnit": null,
      "reasoning": [
        "The altered kernel mixes cable and floor pixels across most target locations.",
        "Noise variation decreases but cable contrast and apparent width also collapse.",
        "A cleaner-looking image therefore fails the feature-retention criterion."
      ],
      "outcome": "The detector misses the cable even though the processed background looks smooth.",
      "criterion": "Filter scale must remain compatible with the smallest retained feature and downstream task.",
      "verification": "Plot target contrast and noise variation across kernel sizes and inspect the first scale where detection fails."
    },
    "misconception": {
      "claim": "More smoothing always makes computer vision more reliable.",
      "mechanism": "Noise reduction is considered without the spatial scale and contrast of the required feature.",
      "correction": "Measure both nuisance reduction and task-relevant feature retention.",
      "disconfirmingObservation": "A larger kernel lowers noise while eliminating the thin edge the robot must detect."
    },
    "assessmentMoves": [
      "sequencing typed pixels through colour and filtering",
      "recovering from an over-smoothed target",
      "screening preprocessing through two retained measures",
      "diagnosing failure from channel and kernel semantics",
      "explaining noise reduction apart from feature preservation",
      "matching filter scale to target geometry",
      "reading channels kernel output and metrics together",
      "revealing a clean image that fails the vision task"
    ],
    "variant": 1
  },
  {
    "lessonId": "EML-E3-D21-L03",
    "instructionMarker": "coverage residual audit",
    "systemModel": "Camera calibration estimates intrinsic parameters and lens distortion from known geometry, then tests how accurately the model projects held-out points across the image field.",
    "failurePattern": "Low calibration-set reprojection error can conceal weak viewpoint coverage, wrong target scale, correlated parameters or failure near image edges and changed focus.",
    "visualExplanation": "Calibration targets cover image position, tilt and distance while observed points, corrected projections and residual vectors expose systematic spatial error.",
    "applicationTask": "Calibrate or inspect a camera dataset, map residuals across the image and validate intrinsics and distortion on held-out target views.",
    "terms": [
      [
        "Lens distortion",
        "A repeatable deviation from ideal pinhole projection described by a chosen parameter model.",
        "A higher-order model can overfit sparse calibration data and extrapolate poorly."
      ],
      [
        "Calibration target",
        "Known geometric features observed from varied poses to constrain camera parameters.",
        "Printed scale, flatness, feature indexing and pose diversity belong to the evidence."
      ],
      [
        "Reprojection error",
        "The pixel difference between observed features and model projections.",
        "A single mean hides spatial pattern, outliers and held-out performance."
      ]
    ],
    "entities": [
      [
        "input",
        "Calibrated-target image set",
        "Images with known feature geometry, scale, detections and capture conditions."
      ],
      [
        "mechanism",
        "Intrinsic-distortion estimation",
        "The optimisation fitting camera parameters and view poses to feature observations."
      ],
      [
        "state",
        "Camera calibration parameters",
        "Focal lengths, principal point, distortion and associated validity conditions."
      ],
      [
        "observation",
        "Held-out residual field",
        "Signed projection residuals over image position, distance and target orientation."
      ],
      [
        "decision",
        "Accepted camera calibration",
        "The model retained when coverage, held-out residuals and physical checks pass."
      ]
    ],
    "relations": [
      [
        "maps",
        "the calibrated-target image set maps into intrinsic-distortion estimation",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "intrinsic-distortion estimation transforms feature geometry into camera calibration parameters",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "coverage scale and model order cause parameter and residual behaviour",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "the held-out residual field supports the accepted camera calibration",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "wrong target scale or systematic residual structure invalidates the accepted camera calibration",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Camera mode, resolution, crop, focus, target dimensions, feature detector and distortion model are declared."
      ],
      [
        "assumption",
        "The target is sufficiently rigid and feature locations represent the known geometry within stated tolerance."
      ],
      [
        "criterion",
        "Held-out residuals, spatial pattern and a known-distance or size check meet declared limits."
      ],
      [
        "operating-state",
        "The altered case uses only centred fronto-parallel views or changes focus after calibration."
      ]
    ],
    "failure": [
      "Calibration is judged only by optimiser convergence and one average residual over the fitted images.",
      "Parameters fit central views but edge residuals and independent scale checks fail.",
      "Reject the calibration until varied coverage, held-out residuals and physical scale evidence agree."
    ],
    "conceptualSteps": [
      "Verify target geometry, scale, image mode and feature indexing before parameter fitting.",
      "Capture views spanning image edges, distance and target tilt rather than many near-duplicates.",
      "Fit the simplest adequate intrinsic and distortion model while retaining residual provenance.",
      "Plot signed residual vectors for held-out views across the complete image field.",
      "Repeat an independent distance or size check and state the calibration's valid camera configuration."
    ],
    "example": {
      "scenario": "A fixed-focus camera observes a measured planar target at varied tilts, depths and image positions.",
      "givenLabel": "Diverse calibration dataset",
      "givenValue": "retained fit images, held-out images, target scale and detected corners",
      "givenUnit": null,
      "reasoning": [
        "Audit target scale and distribute retained views across the image, distance and orientation range.",
        "Fit intrinsics and a bounded distortion model, then project held-out feature geometry.",
        "Inspect residual vectors by image region and compare one known-size reconstruction."
      ],
      "outcome": "Held-out residuals are small, unpatterned and consistent with the independent size check.",
      "criterion": "No material image region or held-out view may fail the declared residual and scale limits.",
      "verification": "Refit without one viewpoint family and confirm the missing coverage creates the expected uncertainty or residual change."
    },
    "counterexample": {
      "scenario": "Dozens of nearly identical target images are captured near the image centre.",
      "givenLabel": "Narrow-coverage calibration",
      "givenValue": "many centred fronto-parallel views and no edge observations",
      "givenUnit": null,
      "reasoning": [
        "The altered set repeats similar constraints instead of observing parameter effects across the field.",
        "Several intrinsic and distortion combinations fit the central data comparably.",
        "Held-out edge projections reveal large structured residuals despite a low training mean."
      ],
      "outcome": "Undistorted edge features bend or shift and pose estimates vary with image position.",
      "criterion": "Calibration evidence must cover the operating field and be validated outside the fitted observations.",
      "verification": "Plot fit and held-out residuals by radius from the principal point and compare parameter stability after adding tilted edge views."
    },
    "misconception": {
      "claim": "More calibration images always produce a better calibration.",
      "mechanism": "Image count is substituted for geometric diversity, data quality and held-out validation.",
      "correction": "Prioritise informative coverage and inspect spatial residuals on unseen views.",
      "disconfirmingObservation": "Many duplicate centre views yield lower fit error but worse edge prediction than a smaller diverse set."
    },
    "assessmentMoves": [
      "sequencing target evidence into a validated calibration",
      "recovering from narrow viewpoint coverage",
      "screening calibration through held-out residual fields",
      "diagnosing edge error from weak constraints",
      "explaining image count apart from information coverage",
      "matching parameter validity to camera configuration",
      "reading target poses parameters and residuals together",
      "revealing low fit error with failed physical scale"
    ],
    "variant": 2
  },
  {
    "lessonId": "EML-E3-D21-L04",
    "instructionMarker": "plane mapping ledger",
    "systemModel": "Projective geometry uses homogeneous coordinates to represent points and lines, while rigid transforms and planar homographies map geometric evidence between camera, world and image frames.",
    "failurePattern": "Incorrect homogeneous normalisation, transform direction or a planar assumption can produce finite-looking coordinates in the wrong frame or with the wrong geometry.",
    "visualExplanation": "A world plane and camera frame connect through a rigid pose and image projection, with homogeneous scale removed only after the complete mapping.",
    "applicationTask": "Transform and project a planar feature between world and image coordinates, then verify direction and scale using known correspondences and an inverse mapping.",
    "terms": [
      [
        "Homogeneous coordinate",
        "A scale-equivalent coordinate representation that allows projective mappings to use matrix multiplication.",
        "Normalisation requires a nonzero scale component and does not preserve metric depth by itself."
      ],
      [
        "Homography",
        "A projective mapping between two views of one plane or between a plane and its image.",
        "It does not generally map arbitrary three-dimensional scene points correctly."
      ],
      [
        "Extrinsic transform",
        "The rigid rotation and translation relating camera coordinates to a world or object frame.",
        "Direction must name destination and source, and translation is expressed in a specific frame."
      ]
    ],
    "entities": [
      [
        "input",
        "Frame-labelled geometric feature",
        "A point, line or planar correspondence with declared source frame and units."
      ],
      [
        "mechanism",
        "Projective transform chain",
        "Rigid pose, homogeneous mapping and normalisation in an explicit order."
      ],
      [
        "state",
        "Mapped projective geometry",
        "The resulting image or plane coordinates with frame and scale semantics."
      ],
      [
        "observation",
        "Correspondence and inverse check",
        "Known feature matches and round-trip reconstruction residuals."
      ],
      [
        "decision",
        "Accepted geometric mapping",
        "The transform or homography retained for its valid scene conditions."
      ]
    ],
    "relations": [
      [
        "maps",
        "the frame-labelled geometric feature maps into the projective transform chain",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the projective transform chain transforms source features into mapped projective geometry",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "frame direction plane validity and normalisation cause mapping behaviour",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "the correspondence and inverse check supports the accepted geometric mapping",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "a nonplanar point or reversed transform invalidates the accepted geometric mapping",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Source and destination frames, coordinate order, units, transform direction and homogeneous normalisation are declared."
      ],
      [
        "assumption",
        "All features mapped by one homography lie on the stated plane or satisfy the equivalent pure-rotation case."
      ],
      [
        "criterion",
        "Held-out correspondences and inverse round trips meet residual limits inside the declared geometric domain."
      ],
      [
        "operating-state",
        "The altered case applies the planar homography to an object elevated materially above the reference plane."
      ]
    ],
    "failure": [
      "A mapping matrix is applied to all visible points because it aligns four selected planar correspondences.",
      "Elevated scene points receive plausible pixels but their error grows with height and viewpoint change.",
      "Reject the broad mapping claim until plane membership, frame direction and held-out correspondence checks pass."
    ],
    "conceptualSteps": [
      "Name source and destination frames and identify whether the task is rigid, planar-projective or full camera projection.",
      "Represent points consistently in homogeneous form without premature normalisation.",
      "Compose rigid and projective mappings in frame-cancelling order.",
      "Normalise valid outputs and compare them with held-out known correspondences.",
      "Test an off-plane feature to expose the mapping boundary before accepting its use."
    ],
    "example": {
      "scenario": "A downward-looking camera maps points on a flat work surface into measured surface coordinates.",
      "givenLabel": "Planar work-surface mapping",
      "givenValue": "calibrated image points, known plane correspondences and held-out marks",
      "givenUnit": null,
      "reasoning": [
        "Confirm all fit and held-out marks lie on the declared physical plane.",
        "Estimate the image-to-plane homography with one coordinate and normalisation convention.",
        "Map held-out marks and apply the inverse mapping to check round-trip and physical residuals."
      ],
      "outcome": "Plane points map consistently in both directions within the declared workspace region.",
      "criterion": "Held-out image and physical-plane residuals must both satisfy their limits.",
      "verification": "Move one test mark outside the fitted polygon but on the same plane and report the change in residual."
    },
    "counterexample": {
      "scenario": "The work-surface homography is used to locate the top of a tall component.",
      "givenLabel": "Off-plane feature",
      "givenValue": "image point from a feature above the calibrated plane",
      "givenUnit": null,
      "reasoning": [
        "The altered feature lies on a different depth plane from the homography correspondences.",
        "Its camera ray intersects the reference plane at a different physical location.",
        "The mapping therefore returns a finite but biased surface coordinate."
      ],
      "outcome": "The robot reaches beside the component even though the image overlay appears aligned at the table.",
      "criterion": "A planar homography may be trusted only for features on its validated plane and region.",
      "verification": "Compare mapped error across known feature heights and use full calibrated pose geometry when height matters."
    },
    "misconception": {
      "claim": "A homography converts any image point into a world point.",
      "mechanism": "The required plane constraint and depth ambiguity are omitted.",
      "correction": "State the reference plane and use additional depth or three-dimensional geometry for off-plane points.",
      "disconfirmingObservation": "Two features on the same camera ray but different heights cannot both map correctly through one table-plane homography."
    },
    "assessmentMoves": [
      "sequencing frame and projective mappings correctly",
      "recovering from an off-plane homography use",
      "screening geometry through held-out correspondences",
      "diagnosing bias from plane assumption",
      "explaining homogeneous scale apart from metric depth",
      "matching mapping type to scene geometry",
      "reading frames correspondences and residuals together",
      "revealing finite coordinates outside valid geometry"
    ],
    "variant": 3
  },
  {
    "lessonId": "EML-E3-D21-L05",
    "instructionMarker": "correspondence provenance review",
    "systemModel": "A feature detector locates repeatable image structure, a descriptor encodes its neighbourhood and matching combines appearance with geometric consistency to retain correspondences.",
    "failurePattern": "Nearest descriptor distance alone accepts repeated textures, lighting artefacts or viewpoint-inconsistent pairs that can corrupt every downstream pose estimate.",
    "visualExplanation": "Keypoints and descriptor links between two images pass through ambiguity rejection and a geometric model, leaving inliers and visibly labelled outliers.",
    "applicationTask": "Match features between two views, compare raw and geometrically filtered correspondences and inspect whether retained matches support one coherent transformation.",
    "terms": [
      [
        "Keypoint",
        "An image location and scale or orientation selected for potentially repeatable local structure.",
        "A detection response does not guarantee repeatability, uniqueness or physical identity."
      ],
      [
        "Descriptor",
        "A numeric representation of the image neighbourhood around a keypoint.",
        "Distance meaning depends on descriptor type, normalisation and the appearance changes it was designed to tolerate."
      ],
      [
        "Geometric verification",
        "Testing candidate matches against a shared scene model and rejecting inconsistent correspondences.",
        "The model, threshold, sample quality and inlier distribution determine what the verification actually proves."
      ]
    ],
    "entities": [
      [
        "input",
        "Two calibrated image views",
        "Images with known array semantics and sufficient shared scene content."
      ],
      [
        "mechanism",
        "Detect-describe-match pipeline",
        "Keypoint extraction, descriptor comparison, ambiguity rejection and geometric fitting."
      ],
      [
        "state",
        "Candidate correspondence set",
        "Putative feature pairs with distances, geometry and retained inlier labels."
      ],
      [
        "observation",
        "Inlier residual distribution",
        "Geometric residuals, spatial spread and repeatability of retained matches."
      ],
      [
        "decision",
        "Accepted feature geometry",
        "The correspondence set retained for pose or mapping with declared support."
      ]
    ],
    "relations": [
      [
        "maps",
        "the two calibrated image views map into the detect-describe-match pipeline",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the detect-describe-match pipeline transforms image structure into candidate correspondences",
        "directed",
        "one-to-many"
      ],
      [
        "causes",
        "appearance ambiguity and viewpoint geometry cause match quality",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "the inlier residual distribution supports the accepted feature geometry",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "clustered or repeated-texture matches invalidate the accepted feature geometry",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Detector, descriptor, distance, match policy, geometric model, residual threshold and image calibration are declared."
      ],
      [
        "assumption",
        "Enough retained features come from shared static structure described by the selected geometric model."
      ],
      [
        "criterion",
        "Inliers have bounded residuals, broad useful spatial support and stability on held-out view pairs."
      ],
      [
        "operating-state",
        "The altered case observes a repetitive facade whose windows yield many similar descriptors."
      ]
    ],
    "failure": [
      "A pose is estimated from the largest set of nearest-neighbour matches without ambiguity or geometry checks.",
      "Repeated texture creates a dense but self-inconsistent correspondence set concentrated in one region.",
      "Reject the geometry until appearance ambiguity, residuals, spatial support and held-out repeatability pass."
    ],
    "conceptualSteps": [
      "Detect keypoints and retain their scale, orientation, response and image position.",
      "Compute compatible descriptors and use the correct distance for their numeric representation.",
      "Reject ambiguous candidate pairs before fitting a scene geometry.",
      "Estimate the geometric model robustly and inspect residuals and inlier spatial distribution.",
      "Test retained correspondences on a changed view and report failure regions and assumptions."
    ],
    "example": {
      "scenario": "Two overlapping views of an asymmetric instrument panel contain textured features distributed across the image.",
      "givenLabel": "Panel correspondence set",
      "givenValue": "calibrated images, keypoints, descriptors and held-out panel points",
      "givenUnit": null,
      "reasoning": [
        "Form descriptor candidates and reject pairs whose nearest alternatives are similarly plausible.",
        "Fit the appropriate geometric model robustly and label inliers from residuals.",
        "Check that inliers span the panel and predict held-out correspondences within tolerance."
      ],
      "outcome": "A distributed inlier set supports one coherent two-view geometry.",
      "criterion": "Residual, inlier spread and held-out prediction criteria must all pass.",
      "verification": "Mask one image region and confirm the geometry remains stable rather than depending on one clustered patch."
    },
    "counterexample": {
      "scenario": "A building facade contains many nearly identical windows and most matches come from one row.",
      "givenLabel": "Repeated-window matches",
      "givenValue": "low descriptor distances with multiple equally plausible partners",
      "givenUnit": null,
      "reasoning": [
        "The altered appearance produces several candidate partners for each repeated window.",
        "Nearest distance alone selects arbitrary offsets that do not share one physical geometry.",
        "A fitted model may appear supported if clustered outliers dominate the sample."
      ],
      "outcome": "The estimated motion or pose points in a physically incorrect direction.",
      "criterion": "Accepted inliers must be geometrically consistent, spatially informative and robust to repeated-texture ambiguity.",
      "verification": "Inspect alternative-match ratios, inlier locations and residuals after removing the repetitive region."
    },
    "misconception": {
      "claim": "The closest descriptor is the same physical point.",
      "mechanism": "Appearance similarity is treated as identity without ambiguity and geometric context.",
      "correction": "Use match ambiguity tests and verify a shared physical geometry.",
      "disconfirmingObservation": "Several identical windows yield almost equal descriptor distances to different physical locations."
    },
    "assessmentMoves": [
      "sequencing detection description and geometry",
      "recovering from repeated-texture matches",
      "screening correspondences through residual and spread",
      "diagnosing false pose from clustered inliers",
      "explaining appearance similarity apart from identity",
      "matching descriptor distance to representation",
      "reading candidates inliers and geometry together",
      "revealing many matches without physical consistency"
    ],
    "variant": 4
  },
  {
    "lessonId": "EML-E3-D21-L06",
    "instructionMarker": "parallax stability register",
    "systemModel": "Depth and pose arise from stereo, motion, active sensing or known geometry by combining multiple rays and frame transforms with explicit scale, uncertainty and degeneracy checks.",
    "failurePattern": "Low parallax, repeated features or nearly degenerate layouts can yield an unstable depth or pose even when a solver returns a precise finite result.",
    "visualExplanation": "Two camera rays triangulate a point while baseline, parallax angle and uncertainty bands show why nearly parallel rays constrain depth poorly.",
    "applicationTask": "Estimate depth or camera pose from two views, vary baseline or feature layout and report residuals, uncertainty and any degenerate configuration.",
    "terms": [
      [
        "Triangulation",
        "Recovery of a spatial point from the intersection or closest approach of rays observed from different poses.",
        "Accuracy depends strongly on baseline, ray angle, calibration and correspondence quality."
      ],
      [
        "Parallax",
        "The change in apparent feature direction caused by a change in viewpoint.",
        "Small parallax makes depth highly sensitive to pixel and pose error."
      ],
      [
        "Pose estimation",
        "Recovery of position and orientation from geometric correspondences under a specified camera model.",
        "A low reprojection residual does not eliminate scale ambiguity or degenerate feature layouts."
      ]
    ],
    "entities": [
      [
        "input",
        "Calibrated multi-view correspondences",
        "Matched image observations with camera intrinsics, frame poses or known object geometry."
      ],
      [
        "mechanism",
        "Triangulation or pose solver",
        "The geometric estimation that reconciles rays and transformations."
      ],
      [
        "state",
        "Depth and pose hypothesis",
        "The estimated spatial structure and camera or object transform with uncertainty."
      ],
      [
        "observation",
        "Reprojection and geometry audit",
        "Held-out pixel residuals, parallax, positive depth and physical-scale checks."
      ],
      [
        "decision",
        "Accepted spatial estimate",
        "The depth or pose retained inside validated geometric conditions."
      ]
    ],
    "relations": [
      [
        "maps",
        "calibrated multi-view correspondences map into the triangulation or pose solver",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the solver transforms image rays into a depth and pose hypothesis",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "baseline parallax and feature layout cause estimate uncertainty",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "the reprojection and geometry audit supports the accepted spatial estimate",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "low parallax or degenerate layout invalidates the accepted spatial estimate",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Camera frames, intrinsics, correspondence direction, baseline or object scale, units and solver model are declared."
      ],
      [
        "assumption",
        "Correspondences refer to the same static features and retained camera poses or object geometry are sufficiently accurate."
      ],
      [
        "criterion",
        "Reprojection, positive-depth, scale, uncertainty and held-out geometry checks all meet declared limits."
      ],
      [
        "operating-state",
        "The altered case uses nearly parallel viewing rays or features concentrated on a degenerate layout."
      ]
    ],
    "failure": [
      "A finite solver result with a low fitted residual is reported without parallax, scale or degeneracy analysis.",
      "Small pixel perturbations produce large depth or pose changes while the reported result remains overconfident.",
      "Reject the estimate until viewing geometry, uncertainty and independent physical checks support it."
    ],
    "conceptualSteps": [
      "Express all rays, camera poses and known geometry in declared frames and consistent units.",
      "Inspect baseline, parallax and feature distribution before solving for depth or pose.",
      "Estimate spatial state using the calibrated model and retain residual and conditioning evidence.",
      "Check positive depth, physical scale and held-out reprojection rather than fit residual alone.",
      "Perturb observations within expected noise and reject estimates whose spatial result is unstable."
    ],
    "example": {
      "scenario": "A calibrated stereo pair observes a textured object with matches spread across depth and the image.",
      "givenLabel": "Stereo depth case",
      "givenValue": "camera baseline, intrinsics, matched pixels and one known-distance check",
      "givenUnit": null,
      "reasoning": [
        "Form rays in the two camera frames and transform them into a common frame.",
        "Triangulate well-separated matches and calculate reprojection residual and parallax.",
        "Compare reconstructed scale with the independent known distance and inspect perturbation sensitivity."
      ],
      "outcome": "Depth and relative geometry agree with image and physical checks inside the validated range.",
      "criterion": "Parallax, reprojection, positive-depth, scale and stability criteria must all pass.",
      "verification": "Reduce the effective baseline in a controlled comparison and confirm estimated depth uncertainty increases."
    },
    "counterexample": {
      "scenario": "A distant object is observed from two camera positions separated by a very small baseline.",
      "givenLabel": "Low-parallax geometry",
      "givenValue": "nearly parallel rays and ordinary pixel noise",
      "givenUnit": null,
      "reasoning": [
        "The altered baseline changes viewing direction by only a small angle.",
        "A tiny correspondence error moves the closest ray intersection a large distance in depth.",
        "The solver returns finite depth but the estimate is not stable enough for the task."
      ],
      "outcome": "Repeated estimates vary greatly in depth while reprojection remains deceptively small.",
      "criterion": "Spatial uncertainty and geometry must satisfy the task, not only pixel residual.",
      "verification": "Perturb each pixel within measured detection noise and plot the resulting depth range."
    },
    "misconception": {
      "claim": "Two camera views always determine depth.",
      "mechanism": "Baseline, parallax, calibration, correspondence and degeneracy conditions are omitted.",
      "correction": "Evaluate viewing geometry and uncertainty before accepting triangulated depth.",
      "disconfirmingObservation": "Nearly parallel rays fit the same pixels while intersecting over a very large depth range."
    },
    "assessmentMoves": [
      "sequencing calibrated rays into spatial geometry",
      "recovering from low-parallax depth",
      "screening estimates through physical and pixel checks",
      "diagnosing uncertainty from viewing geometry",
      "explaining finite solution apart from stable depth",
      "matching feature layout to pose observability",
      "reading baseline rays residual and scale together",
      "revealing low pixel error with large spatial uncertainty"
    ],
    "variant": 5
  },
  {
    "lessonId": "EML-E3-D21-L07",
    "instructionMarker": "deployment outcome census",
    "systemModel": "Robot vision converts calibrated, timestamped images into detections or poses that influence motion through confidence, latency, frame transformation and a defined safe fallback.",
    "failurePattern": "A high offline score can still cause unsafe action when false detections, stale frames, environmental shift or missing uncertainty reaches the controller.",
    "visualExplanation": "A perception-action timeline links exposure, transport, inference, geometric conversion, confidence gate, robot command, observed outcome and fallback transition.",
    "applicationTask": "Test a vision-triggered robot decision across lighting and latency changes, record false outcomes and verify confidence and freshness gates plus the fallback.",
    "terms": [
      [
        "Perception latency",
        "Elapsed time from image exposure to availability of the derived robot observation.",
        "Transport and processing delay make a geometrically accurate result stale for a moving robot."
      ],
      [
        "Confidence gate",
        "A rule deciding whether vision evidence is sufficient for a bounded downstream action.",
        "Model score alone is not calibrated probability or proof of in-domain operation."
      ],
      [
        "Safe fallback",
        "A defined behaviour used when perception evidence is missing, stale, inconsistent or outside limits.",
        "Fallback must be reachable, bounded and tested rather than described only in prose."
      ]
    ],
    "entities": [
      [
        "input",
        "Calibrated timestamped image",
        "The image, exposure time, camera state and validity metadata entering perception."
      ],
      [
        "mechanism",
        "Perception-to-action pipeline",
        "Inference, geometric conversion, gating and control handoff."
      ],
      [
        "state",
        "Timed visual robot observation",
        "A detection or pose with frame, timestamp, confidence and uncertainty."
      ],
      [
        "observation",
        "Outcome and fault evidence",
        "Ground truth, latency, decisions, commands, misses, false actions and fallback events."
      ],
      [
        "decision",
        "Accepted vision capability",
        "The bounded operating claim retained after baseline and altered-condition trials."
      ]
    ],
    "relations": [
      [
        "maps",
        "the calibrated timestamped image maps into the perception-to-action pipeline",
        "directed",
        "many-to-one"
      ],
      [
        "transforms",
        "the perception-to-action pipeline transforms pixels into a timed visual robot observation",
        "directed",
        "many-to-one"
      ],
      [
        "causes",
        "latency confidence and frame conversion cause downstream action quality",
        "directed",
        "many-to-one"
      ],
      [
        "supports",
        "outcome and fault evidence supports the accepted vision capability",
        "directed",
        "many-to-one"
      ],
      [
        "invalidates",
        "a stale false or out-of-domain observation invalidates the accepted vision capability",
        "directed",
        "many-to-one"
      ]
    ],
    "conditions": [
      [
        "boundary",
        "Camera mode, frames, timing source, operating conditions, confidence rule, action limits and fallback are declared."
      ],
      [
        "assumption",
        "Deployment images remain inside the tested visual domain and timing budget unless a gate detects otherwise."
      ],
      [
        "criterion",
        "Task outcomes, false actions, latency, uncertainty, freshness gating and fallback all meet fixed thresholds."
      ],
      [
        "operating-state",
        "The altered case changes lighting or delay so a confident detection arrives after the target has moved."
      ]
    ],
    "failure": [
      "Offline image accuracy is presented as sufficient evidence for closed-loop robot use.",
      "A stale high-score pose triggers motion toward an old target location and bypasses the intended fallback.",
      "Reject the capability until time alignment, altered-domain trials, action outcomes and fallback evidence pass."
    ],
    "conceptualSteps": [
      "Define the physical decision, permitted action envelope and evidence required before vision may influence it.",
      "Carry image exposure time, calibration and frame identity through every processing stage.",
      "Convert output into the robot frame with uncertainty and reject stale or inconsistent observations.",
      "Run repeated baseline and changed-lighting or latency trials while retaining every false and missed action.",
      "Verify the fallback transition and report capability only inside the conditions whose complete criteria pass."
    ],
    "example": {
      "scenario": "A mobile robot uses a calibrated fiducial pose to approach a docking target at bounded speed.",
      "givenLabel": "Vision-guided docking trials",
      "givenValue": "images, exposure timestamps, target poses, commands and ground-truth outcomes",
      "givenUnit": null,
      "reasoning": [
        "Transform each detected target pose into the robot control frame at the image exposure time.",
        "Apply confidence, uncertainty and freshness gates before issuing a bounded approach command.",
        "Reconcile docking error, latency, rejected frames and fallback events across repeated trials."
      ],
      "outcome": "The robot docks within tolerance and enters the tested fallback whenever visual evidence is stale or insufficient.",
      "criterion": "Docking, false-action, latency, gate and fallback thresholds must all pass for every retained trial.",
      "verification": "Introduce a controlled permitted delay and confirm the freshness gate blocks action before the physical error becomes unsafe."
    },
    "counterexample": {
      "scenario": "A highly confident target pose is computed from a delayed frame while the robot and target continue moving.",
      "givenLabel": "Stale confident detection",
      "givenValue": "valid old image geometry with excessive end-to-end latency",
      "givenUnit": null,
      "reasoning": [
        "The altered result is accurate for the exposure time but not for the current control time.",
        "Confidence describes image inference and does not remove motion during the delay.",
        "Without a freshness gate, the controller commands motion toward an obsolete pose."
      ],
      "outcome": "The robot overshoots the docking corridor or approaches the wrong location.",
      "criterion": "A vision result must satisfy both geometric confidence and current-time validity before action.",
      "verification": "Align exposure, inference, command and motion logs and compare the stale case with the tested fallback transition."
    },
    "misconception": {
      "claim": "A high-confidence vision result is safe to use.",
      "mechanism": "Confidence is separated from timing, calibration, domain shift, uncertainty and action consequences.",
      "correction": "Gate vision on complete geometric, temporal and operating evidence with a tested fallback.",
      "disconfirmingObservation": "A correct high-score detection from an old frame causes the wrong present-time robot action."
    },
    "assessmentMoves": [
      "sequencing image evidence into bounded robot action",
      "recovering from a stale confident detection",
      "screening capability through outcomes and fallback",
      "diagnosing unsafe action from the timeline",
      "explaining image confidence apart from control validity",
      "matching freshness and uncertainty to action limits",
      "reading exposure inference command and outcome together",
      "revealing strong offline metrics with unsafe deployment"
    ],
    "variant": 6
  }
] as const satisfies readonly LessonSource[];

const term = academyLessonV2TextRef.term;
const relation = academyLessonV2TextRef.relation;
const condition = academyLessonV2TextRef.condition;
const reasonedCase = academyLessonV2TextRef.reasonedCase;
const misconception = academyLessonV2TextRef.misconception;

const relationEndpoints = [
  [["e1"], ["e2"]],
  [["e2"], ["e3"]],
  [["e3"], ["e4"]],
  [["e4"], ["e5"]],
  [["e1"], ["e5"]]
] as const;

const conditionBindings = [
  [["e1", "e2"], ["r1"]],
  [["e2", "e3"], ["r2", "r3"]],
  [["e4", "e5"], ["r4"]],
  [["e1", "e5"], ["r5"]]
] as const;

const orderingPatterns = [
  {
    base: [
      ["b-establish", ["r1"], ["c1"]],
      ["b-connect", ["r2"], ["c2"]],
      ["b-transform", ["r3"], ["c2"]],
      ["b-accept", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-expose", ["r5"], ["c4"]],
      ["r-rebuild", ["r2", "r3"], ["c2"]],
      ["r-prove", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-source", ["r1"], ["c1"]],
      ["b-propagate", ["r2", "r3"], ["c2"]],
      ["b-verify", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-isolate", ["r5"], ["c4"]],
      ["r-reconnect", ["r1", "r2"], ["c1"]],
      ["r-repeat", ["r3"], ["c2"]],
      ["r-confirm", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-declare", ["r1"], ["c1"]],
      ["b-observe", ["r2"], ["c2"]],
      ["b-predict", ["r3", "r4"], ["c2"]],
      ["b-judge", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-perturb", ["r5"], ["c4"]],
      ["r-hold", ["r1"], ["c1"]],
      ["r-recalculate", ["r3"], ["c2"]],
      ["r-decide", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-bound", ["r1"], ["c1"]],
      ["b-model", ["r2"], ["c2"]],
      ["b-evolve", ["r3"], ["c2"]],
      ["b-limit", ["r4"], ["c3"]],
      ["b-review", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-trigger", ["r5"], ["c4"]],
      ["r-restore", ["r1", "r2"], ["c1"]],
      ["r-retune", ["r3", "r4"], ["c2", "c3"]]
    ]
  },
  {
    base: [
      ["b-identify", ["r1"], ["c1"]],
      ["b-route", ["r2"], ["c2"]],
      ["b-compare", ["r3"], ["c2"]],
      ["b-classify", ["r4"], ["c3"]]
    ],
    retry: [
      ["r-detect", ["r5"], ["c4"]],
      ["r-reroute", ["r2"], ["c2"]],
      ["r-reconcile", ["r3", "r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-frame", ["r1"], ["c1"]],
      ["b-derive", ["r2"], ["c2"]],
      ["b-map", ["r3"], ["c2"]],
      ["b-test", ["r4", "r5"], ["c3"]]
    ],
    retry: [
      ["r-challenge", ["r5"], ["c4"]],
      ["r-restrict", ["r1"], ["c1"]],
      ["r-remap", ["r3"], ["c2"]],
      ["r-audit", ["r4"], ["c3"]]
    ]
  },
  {
    base: [
      ["b-measure", ["r1"], ["c1"]],
      ["b-estimate", ["r2"], ["c2"]],
      ["b-adjust", ["r3"], ["c2"]],
      ["b-constrain", ["r4"], ["c3"]],
      ["b-report", ["r5"], ["c3"]]
    ],
    retry: [
      ["r-disconfirm", ["r5"], ["c4"]],
      ["r-remeasure", ["r1"], ["c1"]],
      ["r-correct", ["r3", "r4"], ["c2", "c3"]]
    ]
  }
] as const;

const instructionPlan = (
  source: LessonSource,
  slot: number
): AcademyLessonV2InstructionPlan => {
  const first = source.terms[0][0];
  const second = source.terms[1][0];
  const trace = source.entities[3][1];
  const judgement = source.entities[4][1];
  const moveSeed = source.assessmentMoves[slot];
  if (moveSeed === undefined) {
    throw new Error(`Missing D21 instruction move ${slot}.`);
  }
  const move = `${moveSeed} in the ${source.instructionMarker}`;
  const copy = [
    [
      `Build the reasoning order from ${first} and ${second} through ${trace} to ${judgement} while ${move}:`,
      `${first} supports ${judgement} because ${move} keeps ${second} tied to ${trace}.`,
      `${judgement} is premature when ${move} skips the ${second} boundary or ${trace}.`,
      `Start from the ${first} condition represented in ${trace} before ${move}.`,
      `Use ${trace} to place ${second} correctly during ${move}.`,
      `Put ${first} ahead of ${second} for ${trace}, then describe ${move}.`,
      `Test ${judgement} against ${trace} after ${move}.`
    ],
    [
      `Recover the altered ${trace} case from ${first} and ${second} while ${move}:`,
      `${trace} supports ${judgement} once ${move} restores the ${first} boundary.`,
      `${second} remains unsupported if ${move} leaves ${trace} unresolved.`,
      `Locate the changed ${trace} condition before ${move}.`,
      `Rebuild the ${first} link governing ${second} and ${trace} during ${move}.`,
      `Retest ${second} against ${trace} while completing ${move}.`,
      `Keep ${judgement} only when ${first} and ${trace} survive ${move}.`
    ],
    [
      `Select the ${first} statements valid for ${second} and ${trace} while ${move}:`,
      `${judgement} is supported because ${move} preserves ${second} and ${trace}.`,
      `A ${first} statement fails when ${move} contradicts the ${trace} boundary.`,
      `Test each ${second} statement against ${first} and ${trace} during ${move}.`,
      `Keep the ${trace} relation whose condition remains true after ${move}.`,
      `Mark ${first} and ${second} statements supported by ${trace} during ${move}.`,
      `Reject ${judgement} when it cannot match ${trace} during ${move}.`
    ],
    [
      `Diagnose why ${trace} changes ${judgement} through ${first} and ${second} while ${move}:`,
      `${first} and ${second} identify the changed ${trace} mechanism when ${move} is applied.`,
      `${judgement} is overclaimed if ${move} ignores the ${first} condition controlling ${trace}.`,
      `Find the first ${second} relation changing ${trace} during ${move}.`,
      `Compare ${trace} with the bounded ${first} case before ${move}.`,
      `Retain the ${second} relation explaining ${judgement} after ${move}.`,
      `Discard the ${first} claim that ${trace} disproves during ${move}.`
    ],
    [
      `Explain ${first} by joining ${second}, ${trace} and ${judgement} while ${move}:`,
      `The explanation joins ${first} to ${judgement} through ${trace} during ${move}.`,
      `The explanation fails when ${move} omits ${second} or the ${trace} criterion.`,
      `Name the ${first} boundary for ${trace} before describing ${move}.`,
      `State how ${second} changes ${trace} during ${move}.`,
      `Connect ${first} to ${judgement} with the relation exposed by ${move}.`,
      `Close with the ${trace} criterion limiting ${judgement} after ${move}.`
    ],
    [
      `Match ${second} evidence to ${first} conditions and ${judgement} while ${move}:`,
      `Each ${trace} pair reaches the ${judgement} condition during ${move}.`,
      `A ${second} pair fails because ${move} assigns the wrong ${first} boundary.`,
      `Pair the earliest ${second} link with its ${first} assumption before ${move}.`,
      `Reserve the ${trace} criterion for the relation concluded after ${move}.`,
      `Align ${first} and ${second} with ${trace} through ${move}.`,
      `Verify every ${judgement} pair by reading ${move} back through ${trace}.`
    ],
    [
      `Trace the ${first} model from ${second} through ${trace} to ${judgement} while ${move}:`,
      `The selected path reaches ${judgement} because ${move} preserves the ${second} relation.`,
      `The model is misread if ${move} bypasses the ${trace} edge limiting ${first}.`,
      `Trace ${first} to ${second} and ${trace} during ${move}.`,
      `Inspect which ${trace} relation remains active after ${move}.`,
      `Follow ${second} arrows before judging ${judgement} during ${move}.`,
      `Select the ${judgement} path that keeps ${first} valid after ${move}.`
    ],
    [
      `Interpret changed ${trace} by tracing ${judgement} back to ${first} and ${second} while ${move}:`,
      `${trace} supports the implication because ${move} retains its ${second} path.`,
      `${judgement} is unsafe when ${move} treats a suppressed ${first} path as active.`,
      `Start at changed ${trace} and identify how ${move} affects ${second}.`,
      `Contrast the active ${first} route through ${trace} during ${move}.`,
      `Reconstruct the ${second} path that ${move} carries towards ${judgement}.`,
      `Accept ${judgement} only if the final ${trace} route agrees with ${move}.`
    ]
  ] as const;
  const plan = copy[slot];
  if (plan === undefined) {
    throw new Error(`Missing D21 instruction plan ${slot}.`);
  }
  return [plan[0], plan[1], plan[2], [plan[3], plan[4]], [plan[5], plan[6]]];
};

type SelectionPlans =
  AcademyLessonTeachingProfileV2CompactPlan["assessmentPlans"]["q3"];
type SelectionOptions = SelectionPlans["base"]["options"];
type ExplanationPlans =
  AcademyLessonTeachingProfileV2CompactPlan["assessmentPlans"]["q4"];

const selectionPlans = (
  source: LessonSource
): SelectionPlans => {
  const plans = (
    baseConditions: readonly string[],
    baseOptions: SelectionOptions,
    retryConditions: readonly string[],
    retryOptions: SelectionOptions
  ): SelectionPlans => ({
    base: {
      instruction: instructionPlan(source, 2),
      focusRef: term("t1", "definition"),
      contextConditionIds: baseConditions,
      options: baseOptions
    },
    retry: {
      instruction: instructionPlan(source, 3),
      focusRef: reasonedCase("counter", "scenario"),
      contextConditionIds: retryConditions,
      options: retryOptions
    }
  });

  switch (source.variant) {
    case 0:
      return plans(
        ["c1", "c2", "c3"],
        [
          ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c4", "c2", "c3"],
        [
          ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-criterion", false, term("t3", "boundary"), condition("c3"), ["r4"], ["c3"], null]
        ]
      );
    case 1:
      return plans(
        ["c1", "c2", "c4"],
        [
          ["b-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c4", "c1", "c3"],
        [
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-boundary", false, term("t2", "boundary"), condition("c1"), ["r1"], ["c1"], null]
        ]
      );
    case 2:
      return plans(
        ["c1", "c3", "c2"],
        [
          ["b-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-r1", false, relation("r1"), condition("c4"), ["r1"], ["c4"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c2", "c4", "c3"],
        [
          ["r-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-term", false, term("t3", "definition"), condition("c1"), ["r1"], ["c1"], null]
        ]
      );
    case 3:
      return plans(
        ["c2", "c3", "c4"],
        [
          ["b-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["b-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-worked", false, reasonedCase("worked", "outcome"), condition("c1"), ["r1"], ["c1"], null]
        ],
        ["c4", "c3", "c2", "c1"],
        [
          ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["r-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["r-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r4", "r5"], ["c3", "c4"], null]
        ]
      );
    case 4:
      return plans(
        ["c1", "c4", "c3"],
        [
          ["b-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-term", false, term("t2", "boundary"), condition("c2"), ["r2"], ["c2"], null]
        ],
        ["c2", "c3", "c4"],
        [
          ["r-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["r-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["r-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ]
      );
    case 5:
      return plans(
        ["c1", "c2", "c3", "c4"],
        [
          ["b-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["b-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["b-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c4", "c1"],
        [
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-r1", true, relation("r1"), condition("c1"), ["r1"], ["c1"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-criterion", false, term("t3", "boundary"), condition("c3"), ["r4"], ["c3"], null]
        ]
      );
    case 6:
      return plans(
        ["c3", "c2", "c1"],
        [
          ["b-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["b-r2", true, relation("r2"), condition("c2"), ["r2"], ["c2"], null],
          ["b-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["b-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r5"], ["c3", "c4"], null]
        ],
        ["c4", "c3", "c2"],
        [
          ["r-r5", true, relation("r5"), condition("c4"), ["r5"], ["c4"], null],
          ["r-r4", true, relation("r4"), condition("c3"), ["r4"], ["c3"], null],
          ["r-r3", true, relation("r3"), condition("c2"), ["r3"], ["c2"], null],
          ["r-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
          ["r-boundary", false, term("t2", "boundary"), condition("c1"), ["r1"], ["c1"], null]
        ]
      );
  }
};

const explanationPlans = (
  source: LessonSource
): ExplanationPlans => {
  switch (source.variant) {
    case 0:
      return {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: misconception("misconception", "claim"),
          contextConditionIds: ["c2", "c3", "c4"],
          conceptGroups: [
            ["definition", term("t1", "label"), [term("t1", "definition")], ["r1"], ["c1"]],
            ["mechanism", relation("r3"), [relation("r3")], ["r3"], ["c2"]],
            ["criterion", condition("c3"), [condition("c3")], ["r4"], ["c3"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r3"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("worked", "verification"),
          contextConditionIds: ["c1", "c2", "c3"],
          pairs: [
            ["pair-1", relation("r1"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", relation("r3"), term("t2", "boundary"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", relation("r4"), condition("c3"), relation("r4"), ["r4"], ["c3"]]
          ]
        }
      };
    case 1:
      return {
        base: {
          kind: "matching",
          instruction: instructionPlan(source, 4),
          focusRef: reasonedCase("worked", "verification"),
          contextConditionIds: ["c1", "c2", "c4"],
          pairs: [
            ["pair-1", relation("r1"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", relation("r2"), condition("c2"), relation("r2"), ["r2"], ["c2"]],
            ["pair-3", relation("r5"), condition("c4"), relation("r5"), ["r5"], ["c4"]]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instructionPlan(source, 5),
          focusRef: misconception("misconception", "claim"),
          contextConditionIds: ["c2", "c3", "c4"],
          conceptGroups: [
            ["definition", term("t2", "label"), [term("t2", "definition")], ["r2"], ["c2"]],
            ["evidence", reasonedCase("worked", "verification"), [reasonedCase("worked", "outcome")], ["r4"], ["c3"]],
            ["failure", reasonedCase("counter", "outcome"), [reasonedCase("counter", "criterion")], ["r5"], ["c4"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r2", "r4"],
          criterionConditionId: "c3"
        }
      };
    case 2:
      return {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: term("t1", "definition"),
          contextConditionIds: ["c1", "c2", "c3"],
          conceptGroups: [
            ["boundary", condition("c1"), [term("t1", "boundary")], ["r1"], ["c1"]],
            ["transform", term("t2", "label"), [relation("r2")], ["r2"], ["c2"]],
            ["mechanism", term("t3", "label"), [relation("r3")], ["r3"], ["c2"]],
            ["criterion", condition("c3"), [reasonedCase("worked", "verification")], ["r4"], ["c3"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r2", "r3"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c1", "c3", "c4"],
          pairs: [
            ["pair-1", relation("r1"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", relation("r3"), condition("c2"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", relation("r4"), condition("c3"), relation("r4"), ["r4"], ["c3"]],
            ["pair-4", relation("r5"), condition("c4"), relation("r5"), ["r5"], ["c4"]]
          ]
        }
      };
    case 3:
      return {
        base: {
          kind: "matching",
          instruction: instructionPlan(source, 4),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3", "c4"],
          pairs: [
            ["pair-1", term("t1", "label"), relation("r1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", term("t2", "label"), relation("r2"), relation("r2"), ["r2"], ["c2"]],
            ["pair-3", term("t3", "label"), relation("r3"), relation("r3"), ["r3"], ["c2"]],
            ["pair-4", condition("c3"), relation("r4"), relation("r4"), ["r4"], ["c3"]]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "outcome"),
          contextConditionIds: ["c4", "c2", "c3"],
          conceptGroups: [
            ["trigger", condition("c4"), [reasonedCase("counter", "scenario")], ["r5"], ["c4"]],
            ["mechanism", relation("r3"), [term("t2", "definition")], ["r2", "r3"], ["c2"]],
            ["evidence", reasonedCase("counter", "verification"), [condition("c3")], ["r4", "r5"], ["c3", "c4"]],
            ["correction", term("t1", "boundary"), [reasonedCase("counter", "verification")], ["r1"], ["c1"]]
          ],
          minimumConceptGroups: 4,
          requiredRelationIds: ["r3", "r5"],
          criterionConditionId: "c3"
        }
      };
    case 4:
      return {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: misconception("misconception", "claim"),
          contextConditionIds: ["c1", "c3", "c4"],
          conceptGroups: [
            ["input", relation("r1"), [condition("c1")], ["r1"], ["c1"]],
            ["decision", relation("r4"), [condition("c3")], ["r4"], ["c3"]],
            ["invalidator", relation("r5"), [condition("c4")], ["r5"], ["c4"]]
          ],
          minimumConceptGroups: 3,
          requiredRelationIds: ["r1", "r4", "r5"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c2", "c3", "c4"],
          pairs: [
            ["pair-1", term("t2", "label"), relation("r2"), relation("r2"), ["r2"], ["c2"]],
            ["pair-2", term("t3", "label"), relation("r3"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", reasonedCase("worked", "verification"), condition("c3"), relation("r4"), ["r4"], ["c3"]],
            ["pair-4", reasonedCase("counter", "outcome"), condition("c4"), relation("r5"), ["r5"], ["c4"]]
          ]
        }
      };
    case 5:
      return {
        base: {
          kind: "matching",
          instruction: instructionPlan(source, 4),
          focusRef: term("t2", "boundary"),
          contextConditionIds: ["c1", "c2", "c3"],
          pairs: [
            ["pair-1", condition("c1"), relation("r1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", condition("c2"), relation("r3"), relation("r3"), ["r3"], ["c2"]],
            ["pair-3", condition("c3"), relation("r4"), relation("r4"), ["r4"], ["c3"]]
          ]
        },
        retry: {
          kind: "short-response",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "scenario"),
          contextConditionIds: ["c1", "c2", "c3", "c4"],
          conceptGroups: [
            ["boundary", term("t1", "boundary"), [condition("c1")], ["r1"], ["c1"]],
            ["model", term("t2", "definition"), [relation("r2")], ["r2"], ["c2"]],
            ["effect", term("t3", "definition"), [relation("r3")], ["r3"], ["c2"]],
            ["criterion", reasonedCase("worked", "verification"), [condition("c3")], ["r4"], ["c3"]],
            ["failure", reasonedCase("counter", "outcome"), [condition("c4")], ["r5"], ["c4"]]
          ],
          minimumConceptGroups: 4,
          requiredRelationIds: ["r2", "r3", "r5"],
          criterionConditionId: "c3"
        }
      };
    case 6:
      return {
        base: {
          kind: "short-response",
          instruction: instructionPlan(source, 4),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3", "c4"],
          conceptGroups: [
            ["source", term("t1", "definition"), [condition("c1")], ["r1"], ["c1"]],
            ["pipeline", term("t2", "definition"), [relation("r2")], ["r2"], ["c2"]],
            ["change", relation("r3"), [condition("c2")], ["r3"], ["c2"]],
            ["evidence", relation("r4"), [condition("c3")], ["r4"], ["c3"]],
            ["stop", relation("r5"), [condition("c4")], ["r5"], ["c4"]]
          ],
          minimumConceptGroups: 5,
          requiredRelationIds: ["r1", "r3", "r4", "r5"],
          criterionConditionId: "c3"
        },
        retry: {
          kind: "matching",
          instruction: instructionPlan(source, 5),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c4", "c3", "c2", "c1"],
          pairs: [
            ["pair-1", term("t1", "label"), condition("c1"), relation("r1"), ["r1"], ["c1"]],
            ["pair-2", term("t2", "label"), condition("c2"), relation("r2"), ["r2"], ["c2"]],
            ["pair-3", term("t3", "label"), term("t3", "boundary"), relation("r3"), ["r3"], ["c2"]],
            ["pair-4", reasonedCase("worked", "verification"), condition("c3"), relation("r4"), ["r4"], ["c3"]],
            ["pair-5", reasonedCase("counter", "outcome"), condition("c4"), relation("r5"), ["r5"], ["c4"]]
          ]
        }
      };
  }
};

const makePlan = (
  source: LessonSource
): AcademyLessonTeachingProfileV2CompactPlan => {
  const terms = source.terms.map(
    (value, index): AcademyDomainTermTuple => [
      `t${index + 1}`,
      value[0],
      value[1],
      value[2],
      index === 0 ? "s1" : index === 1 ? "s2" : "s4"
    ]
  );
  const entities = source.entities.map(
    (value, index): AcademyDomainEntityTuple => [
      `e${index + 1}`,
      value[0],
      value[1],
      value[2]
    ]
  );
  const relations = source.relations.map(
    (value, index): AcademyDomainRelationTuple => {
      const endpoints = relationEndpoints[index];
      if (endpoints === undefined) {
        throw new Error(`Missing D21 relation endpoints ${index}.`);
      }
      return [
        `r${index + 1}`,
        value[0],
        endpoints[0],
        endpoints[1],
        value[1],
        value[2],
        value[3]
      ];
    }
  );
  const conditions = source.conditions.map(
    (value, index): AcademyDomainConditionTuple => {
      const binding = conditionBindings[index];
      if (binding === undefined) {
        throw new Error(`Missing D21 condition binding ${index}.`);
      }
      return [
        `c${index + 1}`,
        value[0],
        value[1],
        binding[0],
        binding[1]
      ];
    }
  );
  const pattern = orderingPatterns[source.variant];
  const mapOrdering = (
    values: readonly (
      readonly [string, readonly string[], readonly string[]]
    )[]
  ) => values.map((value) => [value[0], value[1], value[2]] as const);
  const baseOrdering = mapOrdering(pattern.base);
  const retryOrdering = mapOrdering(pattern.retry);

  return {
    schemaVersion: ACADEMY_LESSON_TEACHING_PROFILE_V2_SCHEMA_VERSION,
    lessonId: source.lessonId,
    systemModel: source.systemModel,
    failurePattern: source.failurePattern,
    visualExplanation: source.visualExplanation,
    applicationTask: source.applicationTask,
    terms,
    entities,
    relations,
    conditions,
    failureBoundary: [
      "f1",
      "c4",
      source.failure[0],
      source.failure[1],
      source.failure[2],
      ["e1", "e5"],
      ["r5"]
    ],
    conceptualModel: [
      ["s1", source.conceptualSteps[0], ["e1", "e2"], ["r1"], ["c1"]],
      ["s2", source.conceptualSteps[1], ["e2", "e3"], ["r2"], ["c2"]],
      ["s3", source.conceptualSteps[2], ["e3", "e4"], ["r3"], ["c2"]],
      ["s4", source.conceptualSteps[3], ["e4", "e5"], ["r4"], ["c3"]],
      ["s5", source.conceptualSteps[4], ["e1", "e5"], ["r5"], ["c4"]]
    ],
    reasonedCases: [
      {
        id: "worked",
        kind: "example",
        scenario: source.example.scenario,
        changedConditionIds: ["c1"],
        givens: [["worked-given", source.example.givenLabel, source.example.givenValue, source.example.givenUnit, "e1"]],
        reasoningSteps: [
          ["worked-1", source.example.reasoning[0], ["e1", "e2"], ["r1"], ["c1"]],
          ["worked-2", source.example.reasoning[1], ["e2", "e4"], ["r2", "r3"], ["c2"]],
          ["worked-3", source.example.reasoning[2], ["e4", "e5"], ["r4"], ["c3"]]
        ],
        outcome: source.example.outcome,
        criterionConditionId: "c3",
        criterion: source.example.criterion,
        verification: source.example.verification
      },
      {
        id: "counter",
        kind: "counterexample",
        scenario: source.counterexample.scenario,
        changedConditionIds: ["c4"],
        givens: [["counter-given", source.counterexample.givenLabel, source.counterexample.givenValue, source.counterexample.givenUnit, "e1"]],
        reasoningSteps: [
          ["counter-1", source.counterexample.reasoning[0], ["e1", "e5"], ["r5"], ["c4"]],
          ["counter-2", source.counterexample.reasoning[1], ["e2", "e5"], ["r2", "r5"], ["c2", "c4"]],
          ["counter-3", source.counterexample.reasoning[2], ["e4", "e5"], ["r4", "r5"], ["c3", "c4"]]
        ],
        outcome: source.counterexample.outcome,
        criterionConditionId: "c3",
        criterion: source.counterexample.criterion,
        verification: source.counterexample.verification
      }
    ],
    misconception: {
      id: "misconception",
      claim: source.misconception.claim,
      mechanism: source.misconception.mechanism,
      correction: source.misconception.correction,
      disconfirmingObservation: source.misconception.disconfirmingObservation,
      entityIds: ["e1", "e3", "e5"],
      relationIds: ["r2", "r5"],
      conditionIds: ["c2", "c4"]
    },
    assessmentPlans: {
      q2: {
        base: {
          instruction: instructionPlan(source, 0),
          focusRef: reasonedCase("worked", "scenario"),
          contextConditionIds: ["c1", "c2", "c3"],
          steps: baseOrdering,
          correctOrder: baseOrdering.map((value) => value[0])
        },
        retry: {
          instruction: instructionPlan(source, 1),
          focusRef: reasonedCase("counter", "verification"),
          contextConditionIds: ["c4", "c3"],
          steps: retryOrdering,
          correctOrder: retryOrdering.map((value) => value[0])
        }
      },
      q3: selectionPlans(source),
      q4: explanationPlans(source),
      q5: {
        base: {
          kind: "diagram",
          instruction: instructionPlan(source, 6),
          focusRef: reasonedCase("counter", "outcome"),
          contextConditionIds: ["c2", "c3", "c4"],
          positions: [["e1", 0, 0], ["e2", 1, 0], ["e3", 2, 0], ["e4", 3, 0], ["e5", 4, 0]],
          relationIds: ["r1", "r2", "r3"],
          answerRelationIds: ["r3"],
          options: [
            ["diagram-correct", true, reasonedCase("worked", "verification"), condition("c3"), ["r3", "r4"], ["c2", "c3"], null],
            ["diagram-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r2", "r5"], ["c4"], "misconception"],
            ["diagram-boundary", false, term("t2", "boundary"), condition("c1"), ["r1"], ["c1"], null]
          ]
        },
        retry: {
          kind: "diagram",
          instruction: instructionPlan(source, 7),
          focusRef: term("t3", "definition"),
          contextConditionIds: ["c1", "c3"],
          positions: [["e1", 0, 1], ["e2", 1, 1], ["e3", 2, 1], ["e4", 3, 1], ["e5", 4, 1]],
          relationIds: ["r3", "r4", "r5"],
          answerRelationIds: ["r4"],
          options: [
            ["retry-correct", true, reasonedCase("worked", "outcome"), reasonedCase("worked", "verification"), ["r4"], ["c3"], null],
            ["retry-misconception", false, misconception("misconception", "claim"), misconception("misconception", "mechanism"), ["r5"], ["c4"], "misconception"],
            ["retry-counter", false, reasonedCase("counter", "outcome"), reasonedCase("counter", "criterion"), ["r3", "r5"], ["c2", "c4"], null]
          ]
        }
      }
    },
    explorerPlan: {
      kind: "shared-graph",
      titleRef: term("t1", "label"),
      focusRef: reasonedCase("worked", "verification"),
      modelKind: "causal-graph",
      positions: [["e1", 0, 0], ["e2", 1, 0], ["e3", 2, 0], ["e4", 3, 0], ["e5", 4, 0]],
      visibleEntityIds: ["e1", "e2", "e3", "e4", "e5"],
      visibleRelationIds: ["r1", "r2", "r3", "r4", "r5"],
      controls: [
        ["bounded", term("t2", "label"), ["c1"], ["e1", "e2", "e3"], ["r1", "r2"], ["r5"], [], [["bounded-note", source.visualExplanation, ["e1", "e2"], ["r1"]]], reasonedCase("worked", "verification")],
        ["altered", term("t3", "label"), ["c4"], ["e1", "e4", "e5"], ["r4", "r5"], ["r1"], [], [["altered-note", source.failure[1], ["e1", "e5"], ["r5"]]], reasonedCase("counter", "verification")]
      ]
    }
  };
};

export const academyLessonTeachingProfileV2PlansE3D21 =
  lessonSources.map(makePlan);

export const academyLessonTeachingProfileV2LessonIdsE3D21 =
  lessonSources.map((source) => source.lessonId);

const materialisedSeeds =
  materialiseAcademyLessonTeachingProfileV2Registry(
    academyLessonTeachingProfileV2LessonIdsE3D21,
    academyLessonTeachingProfileV2PlansE3D21
  );

export const academyLessonTeachingProfilesV2E3D21 =
  Object.fromEntries(
    academyLessonTeachingProfileV2LessonIdsE3D21.map((lessonId) => {
      const seed = materialisedSeeds[lessonId];
      if (seed === undefined) {
        throw new Error(`Missing materialised D21 seed ${lessonId}.`);
      }
      return [lessonId, expandAcademyLessonTeachingProfileV2Seed(seed)];
    })
  ) as AcademyLessonTeachingProfileV2Registry;

export default academyLessonTeachingProfilesV2E3D21;
