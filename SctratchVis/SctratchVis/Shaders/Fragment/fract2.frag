#version 410

// derived from https://glslsandbox.com/e#62243.0

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform vec2 uRes;
uniform vec3 uSpec3;
uniform float uDeltaFreq;
uniform float uDeltaTime;
uniform float uFreq;
uniform float uLastFrame;
uniform float uLastFreq;
uniform float uSpecSum;
uniform float uTime;
uniform float uSpectrum[256];

out vec4 retColor;

#define sinc(x) (sin(x) / x)
#define cosc(x) (cos(x) / x)

const int MAX_ITER = 70;

mat2 rot(float f)
{
	return mat2(
		cos(f), sin(f),
		-sin(f), cos(f)
	);
}

float torus(vec3 p, vec2 t)
{
	vec2 q = abs(vec2(max(abs(p.x), abs(p.z)) - t.x, p.y));
	return max(q.x, q.y) - t.y;
}

float trap(vec3 p)
{
	float a = abs(min(torus(p, vec2(0.3, 0.05)), max(abs(p.z) - 0.05, abs(p.x) - 0.05))) - 0.005;
	float b = abs(length(p.xz) - 0.2) - 0.01;
	float c = length(max(abs(p.xy) - 0.05, 0.0));

	return min(max(a, -b), c);
}

float map(vec3 p)
{
	float cutout = dot(abs(p.yz), vec2(0.5)) - 0.035;
	float road = max(abs(p.y - 0.025), abs(p.z) - 0.035);

	vec3 z = abs(1.0 - mod(p, 2.0));
	z.yz *= rot(uTime * 0.05);

	float d = 999.0;
	float s = 1.0;

	for (float i = 0.0; i < 3.0; i++)
	{
		z.xz *= rot(radians(i * 5.0 + uTime));
		z.zy *= rot(radians(i + 1.0) * 10.0 + uTime * 1.1234);
		z = abs(1.0 - mod(z + i / 3.0, 2.0));

		z = z * 2.0 - 0.3;
		s *= 0.5;
		d = min(d, trap(z) * s);
	}

	return min(max(d, -cutout), road);
}

vec3 hsv(float h, float s, float v)
{
	return mix(vec3(1.0), clamp((abs(fract(h + vec3(3.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0), 0.0, 1.0), s) * v;
}

vec3 intersect(vec3 rayOrig, vec3 rayDir, float f)
{
	float totDist = 0.0;
	vec3 p = rayOrig;
	float d = 1.0;
	float iter = 0.0;
	float mind = PI + sin(uTime * 0.1) * 0.2;

	for (int i = 0; i < MAX_ITER; i++)
	{
		if (d < 0.001) continue;

		d = map(p);
		p += d * vec3(rayDir.x, (rayDir.yz * rot(sin(mind))));
		mind = min(mind, d);
		totDist += d;
		iter++;
	}

	vec3 co = vec3(0.0);

	if (d < 0.001)
	{
		float x = (iter / float(MAX_ITER));
		float y = (d - 0.01) / 0.01 / (float(MAX_ITER));
		float z = (0.01 - d) / 0.01 / float(MAX_ITER);

		// road
		if (max(abs(p.y - 0.025), abs(p.z) - 0.035) < 0.002) 
		{
			float w = smoothstep(mod(p.x * 50.0, 4.0), 2.0, 2.01);
			w -= 1.0 - smoothstep(mod(p.x * 50.0 + 2.0, 4.0), 2.0, 1.99);
			w = fract(w + 0.0001);
			
			float a = fract(smoothstep(abs(p.z), 0.0025, 0.0026));
			co = vec3(1.0 - x - y * 2.0) * 
			mix(vec3(0.8, 0.1, 0.0), vec3(0.1), 1.0 - (1.0 - w) * (1.0 - a));
		}
		else
		{
			float q = 1.0 - x - y * 2.0 + z;
			co = hsv(q * 0.2 + 0.85, 1.0 - q * 0.2, q);
		}
	}
	else
		co = hsv(d, 1.0, 1.0) * mind * 45.0; // background

	return co;
}

vec3 col(vec2 p)
{
	vec3 c = vec3(0.0);
	vec3 ret = vec3(0.0);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = uSpec3;
	float lvf;
	float t = uTime * 0.25;

	vf *= sin(t * (uSpecSum / 256) / TAU);
	lvf = length(vf);
	
	float tf = clamp((t * 0.5), vf.x, step(uFreq, lvf)) + f;
	float df = (abs(uLastFreq - uFreq) * 0.5);

	vec3 upDir = vec3(0.0, -1.0, 0.0);
	vec3 camDir = vec3(1.0, 0.0, 0.0);
	vec3 camOrig = vec3(uTime * 0.0551, 0.0, 0.0);

	vec3 u = normalize(cross(upDir, camOrig));
	vec3 v = normalize(cross(camDir, u));

	vec3 rayDir = normalize(u * p.x + v * p.y + camDir * (1.0 - length(p) * 0.5));

	float af = uFreq > 0.0001 ? 
		uFreq :
		1.0;

	c = intersect(camOrig, rayDir, af);

	ret = c;

	return ret;
}

void main()
{
	vec2 uv;
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 0.5;
	
	retColor = vec4(col(uv), 0.5);
}