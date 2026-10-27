# ML Kit discovers these components by name and invokes their no-argument
# constructors through reflection. R8 full mode must retain those constructors.
-keep class com.google.mlkit.** implements com.google.firebase.components.ComponentRegistrar {
    public <init>();
}
